import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'user-store.json');

interface StoredAccount {
  userId: string;
  email: string;
  name: string;
  role: 'student';
  passwordHash?: string;
  provider: 'email' | 'google-structure' | 'local';
  createdAt: string;
  updatedAt: string;
  profile?: unknown;
  applications?: Record<string, unknown>;
  reminders?: unknown[];
  savedScholarshipIds?: string[];
  comparisonIds?: string[];
}

interface StoreSchema {
  users: Record<string, StoredAccount>;
  reports: unknown[];
  auditLogs: unknown[];
}

async function readStore(): Promise<StoreSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || {},
      reports: parsed.reports || [],
      auditLogs: parsed.auditLogs || [],
    };
  } catch {
    return { users: {}, reports: [], auditLogs: [] };
  }
}

async function writeStore(store: StoreSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'local-student';
    const store = await readStore();
    const record = store.users[userId] || null;
    return NextResponse.json({
      ok: true,
      user: record,
    });
  } catch (error) {
    console.error('GET /api/user-data error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to load user data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : 'local-student';
    const store = await readStore();
    const now = new Date().toISOString();

    const existing = store.users[userId] || {
      userId,
      email: typeof body.email === 'string' ? body.email : '',
      name: typeof body.name === 'string' ? body.name : 'Student',
      role: 'student',
      provider: 'local',
      createdAt: now,
      updatedAt: now,
    };

    if (body.action === 'register' || body.action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ ok: false, error: 'Email is required.' }, { status: 400 });
      }
      const accountKey = `acct_${email}`;
      const existingAccount = store.users[accountKey];

      if (body.action === 'register') {
        const newAccount: StoredAccount = {
          userId: accountKey,
          email,
          name: String(body.name || email.split('@')[0]),
          role: 'student',
          passwordHash: String(body.password || ''),
          provider: body.provider === 'google-structure' ? 'google-structure' : 'email',
          createdAt: existingAccount?.createdAt || now,
          updatedAt: now,
          profile: body.migrateLocalData?.profile || existingAccount?.profile,
          applications: body.migrateLocalData?.applications || existingAccount?.applications,
          reminders: body.migrateLocalData?.reminders || existingAccount?.reminders,
          savedScholarshipIds: body.migrateLocalData?.savedIds || existingAccount?.savedScholarshipIds,
        };
        store.users[accountKey] = newAccount;
        await writeStore(store);
        return NextResponse.json({
          ok: true,
          user: {
            userId: newAccount.userId,
            email: newAccount.email,
            name: newAccount.name,
            role: 'student',
            provider: newAccount.provider,
            profile: newAccount.profile,
            applications: newAccount.applications,
            reminders: newAccount.reminders,
            savedScholarshipIds: newAccount.savedScholarshipIds,
          },
        });
      }

      if (body.action === 'login') {
        if (!existingAccount) {
          const created: StoredAccount = {
            userId: accountKey,
            email,
            name: String(body.name || email.split('@')[0]),
            role: 'student',
            passwordHash: String(body.password || ''),
            provider: body.provider === 'google-structure' ? 'google-structure' : 'email',
            createdAt: now,
            updatedAt: now,
          };
          store.users[accountKey] = created;
          await writeStore(store);
          return NextResponse.json({
            ok: true,
            user: {
              userId: created.userId,
              email: created.email,
              name: created.name,
              role: 'student',
              provider: created.provider,
            },
          });
        }
        if (
          existingAccount.passwordHash &&
          body.password &&
          existingAccount.passwordHash !== String(body.password)
        ) {
          return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
        }
        return NextResponse.json({
          ok: true,
          user: {
            userId: existingAccount.userId,
            email: existingAccount.email,
            name: existingAccount.name,
            role: 'student',
            provider: existingAccount.provider,
            profile: existingAccount.profile,
            applications: existingAccount.applications,
            reminders: existingAccount.reminders,
            savedScholarshipIds: existingAccount.savedScholarshipIds,
          },
        });
      }
    }

    if (body.action === 'reset_password') {
      const email = String(body.email || '').trim().toLowerCase();
      const accountKey = `acct_${email}`;
      if (store.users[accountKey] && body.newPassword) {
        store.users[accountKey].passwordHash = String(body.newPassword);
        store.users[accountKey].updatedAt = now;
        await writeStore(store);
      }
      return NextResponse.json({
        ok: true,
        message: 'Password reset processed for your account.',
      });
    }

    const updated: StoredAccount = {
      ...existing,
      role: 'student',
      updatedAt: now,
      ...(body.profile !== undefined ? { profile: body.profile } : {}),
      ...(body.applications !== undefined ? { applications: body.applications } : {}),
      ...(body.reminders !== undefined ? { reminders: body.reminders } : {}),
      ...(body.savedScholarshipIds !== undefined ? { savedScholarshipIds: body.savedScholarshipIds } : {}),
      ...(body.comparisonIds !== undefined ? { comparisonIds: body.comparisonIds } : {}),
    };

    if (updated.profile && typeof updated.profile === 'object' && 'email' in updated.profile) {
      const profEmail = String((updated.profile as { email?: string }).email || '').toLowerCase();
      if (profEmail) {
        updated.email = profEmail;
      }
    }

    store.users[userId] = updated;
    await writeStore(store);

    return NextResponse.json({ ok: true, updatedAt: now });
  } catch (error) {
    console.error('POST /api/user-data error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to persist user data' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 });
    }
    const store = await readStore();
    delete store.users[userId];
    await writeStore(store);
    return NextResponse.json({ ok: true, deletedUserId: userId });
  } catch (error) {
    console.error('DELETE /api/user-data error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete user data' }, { status: 500 });
  }
}
