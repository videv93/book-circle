import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!adminUser || !isAdmin(adminUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    const now = new Date();
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDateParam) {
      const start = new Date(startDateParam);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDateParam) {
      const end = new Date(endDateParam);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const userWhere = dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {};
    const sessionWhere = dateFilter.gte || dateFilter.lte ? { startedAt: dateFilter } : {};
    const kudosWhere = dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {};
    const bookWhere = dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {};

    const [totalUsers, totalSessions, totalKudos, totalBooks, totalFollows] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.readingSession.count({ where: sessionWhere }),
      prisma.kudos.count({ where: kudosWhere }),
      prisma.book.count({ where: bookWhere }),
      prisma.follow.count(),
    ]);

    const readingTime = await prisma.readingSession.aggregate({
      _sum: { duration: true },
      where: sessionWhere,
    });
    const totalHours = Math.round(((readingTime._sum.duration ?? 0) / 3600) * 10) / 10;

    const activeStreaks = await prisma.userStreak.count({ where: { currentStreak: { gt: 0 } } });
    const verifiedAuthors = await prisma.authorClaim.count({ where: { status: 'APPROVED' } });
    const pendingClaims = await prisma.authorClaim.count({ where: { status: 'PENDING' } });

    const rows = [
      ['Metric', 'Value', 'Export Date'],
      ['Total Users', String(totalUsers), now.toISOString()],
      ['Total Reading Sessions', String(totalSessions), now.toISOString()],
      ['Total Reading Time (hours)', String(totalHours), now.toISOString()],
      ['Active Streaks', String(activeStreaks), now.toISOString()],
      ['Total Kudos', String(totalKudos), now.toISOString()],
      ['Total Follows', String(totalFollows), now.toISOString()],
      ['Total Books', String(totalBooks), now.toISOString()],
      ['Verified Authors', String(verifiedAuthors), now.toISOString()],
      ['Pending Author Claims', String(pendingClaims), now.toISOString()],
    ];

    const csv = rows.map((row) => row.map(escapeCsvField).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="platform-metrics-${now.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export metrics error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
