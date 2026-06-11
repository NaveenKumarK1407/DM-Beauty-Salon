import { NextResponse } from 'next/server';
import { listPayments, savePayment } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payments = await listPayments(100);
    return NextResponse.json({ payments });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { title, amount, date, time, paidBy } = payload || {};

    if (!title || !amount || !paidBy) {
      return NextResponse.json(
        { error: 'title, amount and paidBy are required' },
        { status: 400 }
      );
    }

    const payment = await savePayment({
      title,
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      paidBy,
    });

    return NextResponse.json({ ok: true, payment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
