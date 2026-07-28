"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock3, Container, MapPin, RefreshCw, Sparkles, Truck as TruckIcon, X } from "lucide-react";
import { initialTrucks } from "../src/data/mock-trucks";
import { estimateArrival, getArrivalStatus } from "../src/lib/arrival-estimator";
import { findSwapCandidates, swapReservations } from "../src/lib/swap-matcher";
import type { Truck } from "../src/types";

const STORAGE_KEY = "portflow-trucks";
const statusLabel: Record<Truck["status"], string> = {
  ON_TIME: "정상 도착", EARLY: "조기 도착", LATE: "지각 예상",
  SWAP_RECOMMENDED: "교환 추천", SWAP_PENDING: "교환 대기", SWAP_COMPLETED: "교환 완료",
};

export default function PortFlowShift() {
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const restored = JSON.parse(saved) as Truck[];
      queueMicrotask(() => {
        setTrucks(restored);
        setCompleted(restored[0]?.status === "SWAP_COMPLETED");
      });
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(trucks)); }, [trucks]);

  const myTruck = trucks[0];
  const arrival = estimateArrival(myTruck);
  const arrivalStatus = getArrivalStatus(myTruck.reservationTime, arrival);
  const candidate = useMemo(() => findSwapCandidates(myTruck, trucks)[0], [myTruck, trucks]);

  function confirmSwap() {
    if (!candidate) return;
    setTrucks(swapReservations(trucks, myTruck.id, candidate.truck.id));
    setConfirmOpen(false);
    setCompleted(true);
  }

  return <main className="app">
    <header className="topbar">
      <div className="brand"><img src="/brand/bluesync-logo.png" alt="BlueSync" /></div>
      <span className="live"><i /> 실시간 운행 정보</span>
    </header>

    <div className="page">
      <section className="intro">
        <span>오늘의 운송</span>
        <h1>예약 시간에 맞춰<br />더 빠르게 입항하세요.</h1>
        <p>현재 교통 상황과 도착 예정 시간을 확인하고, 필요하면 더 효율적인 예약 시간으로 교환할 수 있습니다.</p>
      </section>

      {completed && <div className="success" role="status">
        <Check size={20} /><div><b>예약 교환이 완료되었습니다.</b><span>변경된 예약 시간을 아래에서 확인하세요.</span></div>
        <button aria-label="알림 닫기" onClick={() => setCompleted(false)}><X size={18} /></button>
      </div>}

      <section className="reservation">
        <div className="reservation-head">
          <div>
            <span className="label">내 예약</span><h2>{myTruck.terminalName}</h2>
            <p><Container size={16} /> {myTruck.operationType === "IMPORT" ? "수입 · 반입" : "수출 · 반출"} <i /> {myTruck.containerNumber}</p>
          </div>
          <span className={`status ${arrivalStatus.toLowerCase()}`}>{statusLabel[myTruck.status === "SWAP_COMPLETED" ? "SWAP_COMPLETED" : arrivalStatus]}</span>
        </div>

        <div className="schedule">
          <div><small>예약 시간</small><strong>{myTruck.reservationTime}</strong><span>2026년 7월 28일</span></div>
          <div className="route"><i /><span><TruckIcon size={21} /></span><i /></div>
          <div className="arrival"><small>예상 도착</small><strong>{arrival}</strong><span>{myTruck.trafficLevel === "CONGESTED" ? "교통 혼잡 반영" : "현재 교통 반영"}</span></div>
        </div>

        <div className="facts">
          <div><MapPin size={18} /><span><small>남은 거리</small><b>{myTruck.distanceKm}km</b></span></div>
          <div><Clock3 size={18} /><span><small>예상 대기</small><b>{myTruck.estimatedWaitingMinutes}분</b></span></div>
        </div>
      </section>

      {!completed && candidate && <section className="recommendation">
        <div className="recommendation-title">
          <span className="spark"><Sparkles size={22} /></span>
          <div><small>AI 예약 교환 추천</small><h2>대기시간을 {candidate.savedMinutes}분 줄일 수 있어요.</h2><p>같은 터미널과 작업 조건의 차량 중 가장 효율적인 교환 일정을 찾았습니다.</p></div>
        </div>
        <div className="comparison">
          <ScheduleCard label="현재 예약" truck={myTruck} /><span className="swap-icon"><RefreshCw size={20} /></span>
          <ScheduleCard label="교환 후 예약" truck={{ ...myTruck, reservationTime: candidate.truck.reservationTime }} />
        </div>
        <button className="primary" onClick={() => setConfirmOpen(true)}>교환 내용 확인 <ArrowRight size={18} /></button>
      </section>}
    </div>

    {confirmOpen && candidate && <div className="modal-backdrop" role="presentation" onMouseDown={() => setConfirmOpen(false)}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={event => event.stopPropagation()}>
        <span className="modal-icon"><RefreshCw size={25} /></span><h2 id="confirm-title">예약을 교환할까요?</h2>
        <p>예약 시간이 <b>{myTruck.reservationTime}</b>에서 <b>{candidate.truck.reservationTime}</b>으로 변경됩니다.</p>
        <div className="saving"><span>예상 대기시간 절감</span><strong>{candidate.savedMinutes}분</strong></div>
        <button className="primary" onClick={confirmSwap}>예약 교환 확정</button><button className="cancel" onClick={() => setConfirmOpen(false)}>취소</button>
      </section>
    </div>}
  </main>;
}

function ScheduleCard({ label, truck }: { label: string; truck: Truck }) {
  return <article className="schedule-card"><span>{label}</span><strong>{truck.reservationTime}</strong><p>{truck.terminalName}</p></article>;
}
