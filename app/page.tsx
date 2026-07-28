"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell, ChartNoAxesCombined, Check, ChevronRight, Clock3, Container,
  Gauge, Home, ListFilter, MapPin, Menu, RefreshCw, Route, Ship, Sparkles, Truck as TruckIcon,
  Users, WalletCards, X, Zap
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { initialTrucks } from "../src/data/mock-trucks";
import { estimateArrival, getArrivalStatus } from "../src/lib/arrival-estimator";
import { findSwapCandidates, swapReservations } from "../src/lib/swap-matcher";
import type { Role, Truck } from "../src/types";

type View = "home" | "swap" | "queue" | "analytics" | "fleet" | "terminal";
const NAV: {id: View; label: string; icon: typeof Home}[] = [
  { id: "home", label: "홈", icon: Home }, { id: "swap", label: "예약 교환", icon: RefreshCw },
  { id: "queue", label: "대기열", icon: ListFilter }, { id: "analytics", label: "운송 분석", icon: ChartNoAxesCombined },
];
const roles: {id: Role; title: string; desc: string; icon: typeof TruckIcon}[] = [
  { id: "DRIVER", title: "화물차 기사", desc: "내 예약과 AI 교환 추천을 확인해요", icon: TruckIcon },
  { id: "DISPATCHER", title: "배차 담당자", desc: "전체 차량의 운행 현황을 관리해요", icon: Users },
  { id: "TERMINAL", title: "터미널 운영자", desc: "시간대별 혼잡과 처리량을 확인해요", icon: Ship },
];
const analytics = [
  { day: "월", before: 82, after: 54 }, { day: "화", before: 76, after: 49 }, { day: "수", before: 91, after: 58 },
  { day: "목", before: 70, after: 44 }, { day: "금", before: 96, after: 61 }, { day: "토", before: 64, after: 39 },
];
const STATUS = {
  ON_TIME: ["정상 입항", "ok"], EARLY: ["조기 입항", "early"], LATE: ["지각 예상", "late"],
  SWAP_RECOMMENDED: ["교환 추천", "swap"], SWAP_PENDING: ["교환 대기", "swap"], SWAP_COMPLETED: ["교환 완료", "ok"],
} as const;

export default function PortFlowShift() {
  const [role, setRole] = useState<Role>("DRIVER");
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<View>("home");
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(false);
  const me = trucks[0];
  const candidates = useMemo(() => findSwapCandidates(me, trucks), [me, trucks]);
  const candidate = candidates[0];

  useEffect(() => {
    const saved = localStorage.getItem("portflow-state");
    if (saved) try {
      const restored = JSON.parse(saved) as Truck[];
      queueMicrotask(() => setTrucks(restored));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("portflow-state", JSON.stringify(trucks)); }, [trucks]);

  const enter = () => {
    setEntered(true);
    setView(role === "DRIVER" ? "home" : role === "DISPATCHER" ? "fleet" : "terminal");
  };
  const accept = () => {
    if (!candidate) return;
    setTrucks(swapReservations(trucks, me.id, candidate.truck.id));
    setModal(false); setNotice(`예약 교환이 완료됐어요. 총 대기시간 ${candidate.savedMinutes}분을 줄였습니다.`);
    setView("home"); setTimeout(() => setNotice(""), 4500);
  };
  const reset = () => { setTrucks(initialTrucks); setNotice("데모 데이터가 초기화됐어요."); };

  if (!entered) return <main className="login">
    <div className="login-brand"><Logo /><span>PortFlow <b>Shift</b></span></div>
    <section className="welcome">
      <div><span className="kicker"><Sparkles size={14}/> AI 기반 항만 예약 최적화</span>
        <h1>기다림은 줄이고,<br/><em>운송은 흐르게.</em></h1>
        <p>도착 시간을 미리 읽고 가장 효율적인 예약 순서를 제안합니다. 오늘의 역할을 선택하고 PortFlow Shift를 시작하세요.</p>
      </div>
      <div className="role-panel"><h2>어떤 역할로 시작할까요?</h2><p>데모에서 언제든 역할을 바꿀 수 있어요.</p>
        <div className="role-list">{roles.map(({id,title,desc,icon:Icon}) =>
          <button key={id} className={role === id ? "role active" : "role"} onClick={()=>setRole(id)}>
            <span className="role-icon"><Icon size={22}/></span><span><strong>{title}</strong><small>{desc}</small></span>
            <span className="radio">{role === id && <Check size={14}/>}</span>
          </button>)}</div>
        <button className="primary" onClick={enter}>대시보드 시작하기 <ChevronRight size={18}/></button>
      </div>
    </section>
    <div className="port-art"><span/><span/><span/><span/></div>
  </main>;

  const roleTitle = roles.find(r=>r.id===role)?.title;
  return <div className="app-shell">
    <aside><div className="side-brand"><Logo/><span>PortFlow <b>Shift</b></span></div>
      <nav>{(role === "DRIVER" ? NAV : role === "DISPATCHER" ? [{id:"fleet" as View,label:"차량 현황",icon:TruckIcon},...NAV.slice(3)] : [{id:"terminal" as View,label:"운영 대시보드",icon:Gauge},{id:"fleet" as View,label:"차량 현황",icon:TruckIcon}]).map(({id,label,icon:Icon})=>
        <button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={19}/>{label}</button>)}</nav>
      <div className="side-foot"><button onClick={()=>setEntered(false)}><Users size={18}/><span><small>현재 역할</small>{roleTitle}</span><ChevronRight size={16}/></button></div>
    </aside>
    <div className="content">
      <header><div className="mobile-brand"><Logo/><b>PortFlow Shift</b></div><div className="header-title"><span className="live-dot"/> 실시간 운행 데이터</div>
        <div className="header-actions"><span>2026년 7월 28일 화요일</span><button aria-label="알림"><Bell size={19}/><i>3</i></button><button className="avatar">김</button></div></header>
      {notice && <div className="toast"><Check size={18}/>{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></div>}
      <main className="main-content">
        {view === "home" && <DriverHome truck={me} candidate={candidate} onSwap={()=>setView("swap")} onQueue={()=>setView("queue")}/>}
        {view === "swap" && <SwapScreen me={me} candidate={candidate} onAccept={()=>setModal(true)} onReject={()=>setNotice("이 후보를 제외하고 다음 교환을 찾고 있어요.")}/>}
        {view === "queue" && <QueueScreen/>}
        {view === "analytics" && <AnalyticsScreen/>}
        {view === "fleet" && <FleetScreen trucks={trucks}/>}
        {view === "terminal" && <TerminalScreen trucks={trucks}/>}
      </main>
      <nav className="bottom-nav">{NAV.map(({id,label,icon:Icon})=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={20}/><span>{label}</span></button>)}<button onClick={()=>setEntered(false)}><Menu size={20}/><span>더보기</span></button></nav>
      <button className="reset" onClick={reset}>데모 초기화</button>
    </div>
    {modal && <div className="modal-wrap" role="dialog" aria-modal="true"><div className="modal"><span className="modal-icon"><RefreshCw/></span><h2>예약을 교환할까요?</h2><p>내 예약과 <b>{candidate?.truck.truckNumber}</b> 차량의 예약 시간이 서로 변경됩니다. 완료 후에는 되돌릴 수 없어요.</p><div className="modal-summary"><span>예상 대기시간 절감</span><strong>-{candidate?.savedMinutes}분</strong></div><button className="primary" onClick={accept}>교환 확정하기</button><button className="ghost" onClick={()=>setModal(false)}>취소</button></div></div>}
  </div>;
}

function Logo(){return <img className="bluesync-logo" src="/brand/bluesync-logo.png" alt="BlueSync"/>}
function PageHead({eyebrow,title,desc}:{eyebrow:string;title:string;desc:string}){return <div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div><button className="icon-btn"><Bell size={19}/></button></div>}
function StatusBadge({status}:{status:Truck["status"]}){const [label,tone]=STATUS[status];return <span className={`badge ${tone}`}><i/>{label}</span>}

function DriverHome({truck,candidate,onSwap,onQueue}:{truck:Truck;candidate:ReturnType<typeof findSwapCandidates>[0];onSwap:()=>void;onQueue:()=>void}) {
  const eta=estimateArrival(truck); const status=getArrivalStatus(truck.reservationTime,eta);
  return <><PageHead eyebrow="DRIVER DASHBOARD" title="안녕하세요, 김도윤 기사님" desc="오늘의 운행 일정과 항만 상황을 확인하세요."/>
    <section className="hero-card">
      <div className="hero-top"><div><span className="section-label">오늘의 예약</span><h2>{truck.terminalName}</h2><p><Container size={16}/>{truck.operationType==="IMPORT"?"수입 · 반입":"수출 · 반출"} <b>·</b> {truck.containerNumber}</p></div><StatusBadge status={status}/></div>
      <div className="time-line"><div><small>예약 시간</small><strong>{truck.reservationTime}</strong><span>2026. 07. 28</span></div><div className="route-line"><i/><span><TruckIcon size={20}/></span><i/></div><div className="accent"><small>예상 도착</small><strong>{eta}</strong><span>{truck.trafficLevel==="CONGESTED"?"교통 혼잡 반영":"현재 교통 반영"}</span></div></div>
      <div className="delay-callout"><span><Clock3 size={20}/></span><div><strong>예약보다 35분 늦게 도착할 예정이에요</strong><p>대기시간을 줄일 수 있는 예약 교환 후보를 찾았습니다.</p></div><button onClick={onSwap}>AI 추천 보기 <ChevronRight size={17}/></button></div>
      <div className="hero-actions"><button onClick={onSwap}><RefreshCw size={18}/>예약 교환 찾기</button><button onClick={onQueue}><ListFilter size={18}/>가상 대기 등록</button><button><Route size={18}/>경로 확인</button></div>
    </section>
    <div className="metric-grid"><Metric icon={MapPin} label="현재 위치" value="부산 강서구" sub="항만까지 18.4km"/><Metric icon={Clock3} label="예상 대기시간" value="68분" sub="혼잡 시간대"/><Metric icon={ListFilter} label="가상 대기 순번" value="12번째" sub="약 42분 후 호출"/><Metric icon={WalletCards} label="보유 포인트" value="1,240 P" sub="이번 달 +350 P"/></div>
    {candidate&&<section className="ai-strip"><span><Sparkles size={22}/></span><div><small>PORTFLOW AI</small><strong>더 빠른 방법을 찾았어요</strong><p>예약을 교환하면 두 차량의 총 대기시간을 <b>{candidate.savedMinutes}분</b> 줄일 수 있습니다.</p></div><button onClick={onSwap}>추천 확인</button></section>}
  </>;
}
function Metric({icon:Icon,label,value,sub}:{icon:typeof MapPin;label:string;value:string;sub:string}){return <article className="metric"><span><Icon size={19}/></span><small>{label}</small><strong>{value}</strong><p>{sub}</p></article>}

function SwapScreen({me,candidate,onAccept,onReject}:{me:Truck;candidate:ReturnType<typeof findSwapCandidates>[0];onAccept:()=>void;onReject:()=>void}) {
 if(!candidate)return <Empty title="교환 가능한 차량이 없어요" body="가상 대기열에 등록하면 적절한 시점에 다시 알려드릴게요."/>;
 return <><PageHead eyebrow="AI RESERVATION SWAP" title="예약 교환 추천" desc="도착 예측과 항만 혼잡도를 분석해 가장 효율적인 교환을 찾았어요."/>
   <div className="impact-row"><div><small>총 대기시간 절감</small><strong>-{candidate.savedMinutes}분</strong></div><div><small>공회전 감소</small><strong>-38분</strong></div><div><small>예상 탄소배출 감소</small><strong>-6.8kg</strong></div></div>
   <section className="swap-card"><div className="ai-title"><span><Sparkles size={19}/></span><div><small>AI 추천 · 매칭 정확도 94%</small><h2>서로의 빈 시간을 채우는 최적 교환</h2></div></div>
    <div className="truck-compare"><TruckCompare label="내 차량" truck={me}/><div className="swap-circle"><RefreshCw/></div><TruckCompare label="교환 차량" truck={candidate.truck}/></div>
    <div className="reason"><Zap size={19}/><p><b>왜 이 교환을 추천하나요?</b><br/>내 차량은 35분 지각이 예상되고, 상대 차량은 55분 일찍 도착합니다. 예약 시간을 바꾸면 두 차량의 대기와 공회전을 함께 줄일 수 있어요.</p></div>
    <div className="swap-actions"><button className="primary" onClick={onAccept}>교환 수락</button><button className="secondary" onClick={onReject}>교환 거절</button><button className="text-btn">다른 교환 찾기</button></div>
   </section></>;
}
function TruckCompare({label,truck}:{label:string;truck:Truck}){return <article className="truck-box"><span>{label}</span><h3>{truck.truckNumber}</h3><p>{truck.driverName} · {truck.companyName}</p><dl><div><dt>기존 예약</dt><dd>{truck.reservationTime}</dd></div><div><dt>예상 도착</dt><dd>{truck.estimatedArrivalTime}</dd></div><div><dt>예상 대기</dt><dd>{truck.estimatedWaitingMinutes}분</dd></div></dl></article>}

function QueueScreen(){const spots=[["신항 북컨테이너 대기장","2.4km","약 7분","여유"],["부산항 화물차 휴게소","5.8km","약 14분","보통"],["녹산 임시 대기장","8.1km","약 19분","여유"]];return <><PageHead eyebrow="VIRTUAL QUEUE" title="가상 대기열" desc="항만 밖에서 편안하게 대기하고 호출 시간에 맞춰 출발하세요."/><section className="queue-hero"><div><small>현재 대기 순번</small><strong>12</strong><span>번째</span></div><div><small>예상 호출 시간</small><b>오전 11:42</b><p>약 42분 남음</p></div><div><small>터미널 혼잡도</small><b>높음</b><p>현재 38대 대기 중</p></div></section><div className="leave-alert"><Clock3/><div><b>오전 11:20에 항만으로 출발하세요</b><p>현재 위치에서 예상 이동시간은 18분입니다.</p></div></div><h2 className="subheading">주변 대기 장소</h2><div className="place-list">{spots.map((s,i)=><article key={s[0]}><span className="place-num">{i+1}</span><div><h3>{s[0]}</h3><p><MapPin size={14}/>{s[1]} · 이동 {s[2]}</p></div><div className="amenities"><span>주차 가능</span><span>{i===1?"식당":"화장실"}</span><span>{i===0?"충전소":"편의점"}</span></div><b className={s[3]==="여유"?"free":""}>{s[3]}</b></article>)}</div></>}
function AnalyticsScreen(){return <><PageHead eyebrow="EFFICIENCY ANALYTICS" title="운송 효율 분석" desc="예약 교환으로 줄어든 시간과 비용을 한눈에 확인하세요."/><div className="metric-grid analytics-metrics"><Metric icon={Clock3} label="이번 달 절감 대기시간" value="8시간 24분" sub="지난달 대비 18% 향상"/><Metric icon={TruckIcon} label="감소한 지각 운행" value="14건" sub="정시 도착률 92%"/><Metric icon={Gauge} label="줄어든 공회전" value="5시간 10분" sub="연료 약 41L 절감"/><Metric icon={Sparkles} label="교환 참여" value="9회" sub="성공률 100%"/></div><section className="chart-card"><div><h2>교환 전·후 평균 대기시간</h2><p>단위: 분</p></div><ResponsiveContainer width="100%" height={280}><BarChart data={analytics}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="before" name="교환 전" fill="#cbd5e1" radius={[6,6,0,0]}/><Bar dataKey="after" name="교환 후" fill="#0b7770" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></section></>}
function FleetScreen({trucks}:{trucks:Truck[]}){const [filter,setFilter]=useState("전체");const fs=trucks.filter(t=>filter==="전체"||STATUS[t.status][0].includes(filter));return <><PageHead eyebrow="FLEET CONTROL" title="차량 운행 현황" desc={`${trucks.length}대 차량의 예약과 도착 상태를 확인하세요.`}/><div className="filters">{["전체","정상","조기","지각","교환"].map(f=><button className={filter===f?"active":""} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="fleet-table"><div className="table-head"><span>차량 / 기사</span><span>터미널</span><span>예약</span><span>예상 도착</span><span>상태</span><span>대기</span></div>{fs.map(t=><div className="table-row" key={t.id}><span><b>{t.truckNumber}</b><small>{t.driverName} · {t.companyName}</small></span><span>{t.terminalName}</span><span>{t.reservationTime}</span><span>{t.estimatedArrivalTime}</span><span><StatusBadge status={t.status}/></span><span><b>{t.estimatedWaitingMinutes}분</b></span></div>)}</div></>}
function TerminalScreen({trucks}:{trucks:Truck[]}){const data=[{t:"08시",r:8,c:12},{t:"09시",r:14,c:16},{t:"10시",r:21,c:18},{t:"11시",r:17,c:19},{t:"12시",r:11,c:17},{t:"13시",r:16,c:20},{t:"14시",r:19,c:21}];return <><PageHead eyebrow="TERMINAL OPERATIONS" title="부산신항 운영 대시보드" desc="시간대별 예약 밀도와 처리 가능 차량을 비교합니다."/><div className="impact-row"><div><small>오늘 예약 차량</small><strong>{trucks.length * 4}대</strong></div><div><small>현재 지각 예상</small><strong>{trucks.filter(t=>t.status==="LATE").length}대</strong></div><div><small>AI 교환 완료</small><strong>7건</strong></div></div><section className="chart-card"><div><h2>시간대별 예약 · 처리 용량</h2><p>현재 10시 혼잡 구간입니다</p></div><ResponsiveContainer width="100%" height={310}><AreaChart data={data}><defs><linearGradient id="teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b7770" stopOpacity=".35"/><stop offset="100%" stopColor="#0b7770" stopOpacity=".02"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="t" axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="r" name="예약 차량" stroke="#0b7770" fill="url(#teal)" strokeWidth={3}/><Area type="monotone" dataKey="c" name="처리 가능" stroke="#e2a73b" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></section></>}
function Empty({title,body}:{title:string;body:string}){return <div className="empty"><RefreshCw/><h2>{title}</h2><p>{body}</p></div>}
