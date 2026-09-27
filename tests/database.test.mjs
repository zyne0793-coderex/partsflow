import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("workspace permissions, invitations, stock and work orders", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
 create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('request.jwt.claim.email',true)) $$;
 grant usage on schema auth to authenticated;
 grant execute on all functions in schema auth to authenticated;
 insert into auth.users values
 ('00000000-0000-4000-8000-000000000001','owner@example.test',now()),
 ('00000000-0000-4000-8000-000000000002','member@example.test',now()),
 ('00000000-0000-4000-8000-000000000003','outsider@example.test',now());`);
  await db.exec(
    await readFile(
      new URL("../supabase/schema-phase-1.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20260926175339_complete_inventory.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const login = async (n, email) =>
    db.exec(
      `reset role; set request.jwt.claim.sub='00000000-0000-4000-8000-${String(n).padStart(12, "0")}'; set request.jwt.claim.email='${email}@example.test'; set role authenticated;`,
    );
  const scalar = async (sql, params = []) =>
    Object.values((await db.query(sql, params)).rows[0])[0];
  await login(1, "owner");
  const team = await scalar("select public.create_workspace('Workshop')");
  const part = await scalar(
    "insert into parts(workspace_id,part_number,name) values($1,'BRG-6205','Bearing 6205') returning id",
    [team],
  );
  const order = await scalar(
    "insert into work_orders(workspace_id,title) values($1,'Pump repair') returning id",
    [team],
  );
  await t.test("receiving and issuing stock updates balance", async () => {
    await db.query(
      "insert into stock_movements(workspace_id,part_id,quantity,note) values($1,$2,10,'Opening stock')",
      [team, part],
    );
    await db.query(
      "insert into stock_movements(workspace_id,part_id,quantity,note,work_order_id) values($1,$2,-3,'Repair',$3)",
      [team, part, order],
    );
    assert.equal(
      Number(
        await scalar("select quantity from inventory where id=$1", [part]),
      ),
      7,
    );
  });
  await t.test("insufficient stock is rejected atomically", async () => {
    await assert.rejects(
      db.query(
        "insert into stock_movements(workspace_id,part_id,quantity,note) values($1,$2,-8,'Too much')",
        [team, part],
      ),
      /Insufficient stock/,
    );
    assert.equal(
      Number(
        await scalar("select quantity from inventory where id=$1", [part]),
      ),
      7,
    );
  });
  await t.test(
    "stock history cannot be rewritten and units remain consistent",
    async () => {
      await assert.rejects(
        db.query("update stock_movements set quantity=999 where part_id=$1", [
          part,
        ]),
        /permission denied/,
      );
      await assert.rejects(
        db.query("delete from stock_movements where part_id=$1", [part]),
        /permission denied/,
      );
      await assert.rejects(
        db.query("update parts set unit='box' where id=$1", [part]),
        /Cannot change the unit/,
      );
    },
  );
  await t.test(
    "closed orders and archived parts reject new movements",
    async () => {
      await db.query("update work_orders set status='completed' where id=$1", [
        order,
      ]);
      await assert.rejects(
        db.query(
          "insert into stock_movements(workspace_id,part_id,quantity,note,work_order_id) values($1,$2,-1,'Closed',$3)",
          [team, part, order],
        ),
        /closed or unavailable/,
      );
      await db.query("update parts set archived=true where id=$1", [part]);
      await assert.rejects(
        db.query(
          "insert into stock_movements(workspace_id,part_id,quantity,note) values($1,$2,1,'Archived')",
          [team, part],
        ),
        /unavailable or archived/,
      );
      await db.query(
        "update parts set archived=false,minimum_stock=8 where id=$1",
        [part],
      );
      assert.equal(
        await scalar("select low_stock from inventory where id=$1", [part]),
        true,
      );
    },
  );
  const invite = await scalar(
    "insert into team_invitations(workspace_id,email,role) values($1,'member@example.test','viewer') returning id",
    [team],
  );
  await login(3, "outsider");
  const other = await scalar("select create_workspace('Other workshop')");
  await t.test("outsiders cannot read or write another workspace", async () => {
    assert.equal(
      await scalar("select count(*) from inventory where workspace_id=$1", [
        team,
      ]),
      0,
    );
    await assert.rejects(
      db.query(
        "insert into parts(workspace_id,part_number,name) values($1,'BAD','Bad')",
        [team],
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.query("select accept_invitation($1)", [invite]),
      /unavailable or expired/,
    );
  });
  await login(2, "member");
  await t.test("matching verified recipient can accept once", async () => {
    assert.equal(await scalar("select accept_invitation($1)", [invite]), team);
    await assert.rejects(
      db.query("select accept_invitation($1)", [invite]),
      /unavailable or expired/,
    );
  });
  await t.test(
    "viewers read but cannot modify data or escalate roles",
    async () => {
      assert.equal(
        await scalar("select count(*) from parts where workspace_id=$1", [
          team,
        ]),
        1,
      );
      assert.equal(
        (
          await db.query(
            "update parts set name='Changed' where id=$1 returning id",
            [part],
          )
        ).rows.length,
        0,
      );
      await assert.rejects(
        db.query(
          "insert into work_orders(workspace_id,title) values($1,'Forbidden')",
          [team],
        ),
        /row-level security/,
      );
      await assert.rejects(
        db.query("select manage_member($1,auth.uid(),'admin')", [team]),
        /Only the owner/,
      );
    },
  );
  await login(1, "owner");
  await db.query(
    "select manage_member($1,'00000000-0000-4000-8000-000000000002','member')",
    [team],
  );
  await t.test("owners cannot be demoted or removed", async () => {
    await assert.rejects(
      db.query("select manage_member($1,auth.uid(),'remove')", [team]),
      /owner cannot/,
    );
  });
  await login(2, "member");
  await t.test(
    "members can edit, but cannot move records between workspaces",
    async () => {
      assert.equal(
        (
          await db.query(
            "update parts set name='Team bearing' where id=$1 returning id",
            [part],
          )
        ).rows.length,
        1,
      );
      await assert.rejects(
        db.query("update parts set workspace_id=$1 where id=$2", [other, part]),
        /permission denied/,
      );
      await assert.rejects(
        db.query(
          "insert into stock_movements(workspace_id,part_id,quantity,note) values($1,$2,1,'Wrong team')",
          [other, part],
        ),
        /row-level security|unavailable/,
      );
    },
  );
  await login(1, "owner");
  await db.query(
    "select manage_member($1,'00000000-0000-4000-8000-000000000002','remove')",
    [team],
  );
  await login(2, "member");
  await t.test("removed members immediately lose access", async () => {
    assert.equal(
      await scalar("select count(*) from parts where workspace_id=$1", [team]),
      0,
    );
  });
  await db.close();
});
