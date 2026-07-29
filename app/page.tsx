"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell, ChartNoAxesCombined, Check, ChevronRight, Clock3, Container,
  CircleHelp, Gauge, Home, ListFilter, MapPin, Menu, RefreshCw, Route, Ship, Sparkles, Truck as TruckIcon,
  Users, X, Zap
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { initialTrucks } from "../src/data/mock-trucks";
import { estimateArrival, getArrivalStatus } from "../src/lib/arrival-estimator";
import { maskPersonName } from "../src/lib/privacy";
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

export default function BlueSync() {
  const [role, setRole] = useState<Role>("DRIVER");
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<View>("home");
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(false);
  const [routeModal, setRouteModal] = useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [candidateIndex,setCandidateIndex]=useState(0);
  const [swapLoading,setSwapLoading]=useState(false);
  const [guideOpen,setGuideOpen]=useState(false);
  const [guideStep,setGuideStep]=useState(0);
  const me = trucks[0];
  const candidates = useMemo(() => findSwapCandidates(me, trucks), [me, trucks]);
  const candidate = candidates[candidateIndex % Math.max(candidates.length,1)];
  const findNextCandidate=()=>{if(swapLoading||candidates.length<2)return;setSwapLoading(true);setTimeout(()=>{setCandidateIndex(i=>(i+1)%candidates.length);setSwapLoading(false);},900)};

  useEffect(() => {
    const saved = localStorage.getItem("bluesync-state");
    if (saved) try {
      const restored = JSON.parse(saved) as Truck[];
      queueMicrotask(() => setTrucks(restored));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("bluesync-state", JSON.stringify(trucks)); }, [trucks]);

  const enter = () => {
    setEntered(true);
    setView(role === "DRIVER" ? "home" : role === "DISPATCHER" ? "fleet" : "terminal");
    if (!localStorage.getItem("bluesync-guide-seen")) {
      setGuideStep(0);
      setGuideOpen(true);
    }
  };
  const openGuide = () => { setGuideStep(0); setGuideOpen(true); };
  const closeGuide = () => {
    localStorage.setItem("bluesync-guide-seen", "true");
    setGuideOpen(false);
  };
  const accept = () => {
    if (!candidate) return;
    setTrucks(swapReservations(trucks, me.id, candidate.truck.id));
    setModal(false); setNotice(`예약 교환이 완료됐어요. 총 대기시간 ${candidate.savedMinutes}분을 줄였습니다.`);
    setView("home"); setTimeout(() => setNotice(""), 4500);
  };
  const reset = () => { setTrucks(initialTrucks); setNotice("데모 데이터가 초기화됐어요."); };

  if (!entered) return <main className="login">
    <div className="login-brand"><Logo /><span>BlueSync</span></div>
    <section className="welcome">
      <div><span className="kicker"><Sparkles size={14}/> AI 기반 항만 예약 최적화</span>
        <h1>기다림은 줄이고,<br/><em>운송은 흐르게.</em></h1>
        <p>도착 시간을 미리 읽고 가장 효율적인 예약 순서를 제안합니다. 오늘의 역할을 선택하고 BlueSync를 시작하세요.</p>
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
    <aside><div className="side-brand"><Logo/><span>BlueSync</span></div>
      <nav>{(role === "DRIVER" ? NAV : role === "DISPATCHER" ? [{id:"fleet" as View,label:"차량 현황",icon:TruckIcon},...NAV.slice(3)] : [{id:"terminal" as View,label:"운영 대시보드",icon:Gauge},{id:"fleet" as View,label:"차량 현황",icon:TruckIcon}]).map(({id,label,icon:Icon})=>
        <button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={19}/>{label}</button>)}</nav>
      <div className="side-foot"><button onClick={()=>setEntered(false)}><Users size={18}/><span><small>현재 역할</small>{roleTitle}</span><ChevronRight size={16}/></button></div>
    </aside>
    <div className="content">
      <header><div className="mobile-brand"><Logo/><b>BlueSync</b></div><div className="header-title"><span className="live-dot"/> 실시간 운행 데이터</div>
        <div className="header-actions"><span>2026년 7월 29일 수요일</span><button aria-label="알림" onClick={()=>setNotificationsOpen(v=>!v)}><Bell size={19}/><i>3</i></button><button className="avatar">김</button></div>
        {notificationsOpen&&<NotificationPanel candidate={candidate} onOpenSwap={()=>{setNotificationsOpen(false);setView("swap")}} onClose={()=>setNotificationsOpen(false)}/>}</header>
      {notice && <div className="toast"><Check size={18}/>{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></div>}
      <main className="main-content">
        {view === "home" && <DriverHome truck={me} candidate={candidate} onSwap={()=>setView("swap")} onQueue={()=>setView("queue")} onRoute={()=>setRouteModal(true)}/>}
        {view === "swap" && <SwapScreen me={me} candidate={candidate} loading={swapLoading} onAccept={()=>setModal(true)} onReject={findNextCandidate} onNext={findNextCandidate}/>}
        {view === "queue" && <QueueScreen/>}
        {view === "analytics" && <AnalyticsScreen/>}
        {view === "fleet" && <FleetScreen trucks={trucks}/>}
        {view === "terminal" && <TerminalScreen trucks={trucks}/>}
      </main>
      <nav className="bottom-nav">{NAV.map(({id,label,icon:Icon})=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={20}/><span>{label}</span></button>)}<button onClick={()=>setEntered(false)}><Menu size={20}/><span>더보기</span></button></nav>
      <button className="reset" onClick={reset}>데모 초기화</button>
      <button className="guide-reopen" onClick={openGuide}><CircleHelp size={15}/>이용 가이드</button>
    </div>
    {modal && <div className="modal-wrap" role="dialog" aria-modal="true"><div className="modal"><span className="modal-icon"><RefreshCw/></span><h2>예약을 교환할까요?</h2><p>내 예약과 <b>{candidate?.truck.truckNumber}</b> 차량의 예약 시간이 서로 변경됩니다. 완료 후에는 되돌릴 수 없어요.</p><div className="modal-summary"><span>예상 대기시간 절감</span><strong>-{candidate?.savedMinutes}분</strong></div><button className="primary" onClick={accept}>교환 확정하기</button><button className="ghost" onClick={()=>setModal(false)}>취소</button></div></div>}
    {routeModal && <RouteMapModal onClose={()=>setRouteModal(false)}/>}
    {guideOpen && <GuideModal step={guideStep} onStep={setGuideStep} onClose={closeGuide}/>}
  </div>;
}

const GUIDE_STEPS = [
  {
    icon: Home,
    eyebrow: "STEP 1 · 오늘의 운행",
    title: "예약 카드부터 확인하세요",
    body: "홈에서 예약 시간, 예상 도착 시간, 터미널과 컨테이너 정보를 한눈에 확인할 수 있어요.",
    tip: "빨간 예상 도착 시간은 지각 가능성이 높다는 뜻이에요.",
  },
  {
    icon: Clock3,
    eyebrow: "STEP 2 · 도착 상태",
    title: "배지로 상황을 빠르게 판단하세요",
    body: "정상 입항, 조기 입항, 지각 예상 상태를 색상과 문구로 함께 표시해 운전 중에도 쉽게 구분할 수 있어요.",
    tip: "지각 예상 또는 조기 입항이면 예약 교환 후보가 자동으로 검색돼요.",
  },
  {
    icon: RefreshCw,
    eyebrow: "STEP 3 · AI 예약 교환",
    title: "추천 이유와 절감 효과를 비교하세요",
    body: "두 차량의 예약·도착·대기시간을 비교한 뒤, 총 대기시간이 실제로 줄어드는 교환만 추천합니다.",
    tip: "교환 수락 전 절감 시간과 추천 이유를 꼭 확인하세요.",
  },
  {
    icon: ListFilter,
    eyebrow: "STEP 4 · 가상 대기열",
    title: "항만 밖에서 편하게 기다리세요",
    body: "현재 순번과 예상 호출 시간을 확인하고, 안내된 추천 출발 시간에 맞춰 항만으로 이동하면 돼요.",
    tip: "주변 대기 장소의 거리와 편의시설도 함께 확인할 수 있어요.",
  },
  {
    icon: ChartNoAxesCombined,
    eyebrow: "STEP 5 · 운송 분석",
    title: "줄어든 시간과 비용을 확인하세요",
    body: "운송 분석에서 교환 전후 대기시간, 공회전 감소, 정시 도착률 등 누적 효과를 확인할 수 있어요.",
    tip: "이제 홈의 AI 추천부터 직접 사용해 보세요!",
  },
] as const;

function GuideModal({step,onStep,onClose}:{step:number;onStep:(step:number)=>void;onClose:()=>void}) {
  const current = GUIDE_STEPS[step];
  const Icon = current.icon;
  const last = step === GUIDE_STEPS.length - 1;
  return <div className="guide-wrap" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <section className="guide-modal">
      <div className="guide-top">
        <div className="guide-brand"><Logo/><span>처음 오셨나요?</span></div>
        <button onClick={onClose} aria-label="이용 가이드 닫기"><X size={20}/></button>
      </div>
      <div className="guide-progress" aria-label={`이용 가이드 ${step + 1}/${GUIDE_STEPS.length}`}>
        {GUIDE_STEPS.map((_,index)=><i key={index} className={index <= step ? "active" : ""}/>)}
      </div>
      <div className="guide-visual"><span><Icon size={34}/></span><i/><i/><i/></div>
      <div className="guide-copy">
        <small>{current.eyebrow}</small>
        <h2 id="guide-title">{current.title}</h2>
        <p>{current.body}</p>
        <div><Sparkles size={17}/><span>{current.tip}</span></div>
      </div>
      <div className="guide-actions">
        {!last ? <button className="guide-skip" onClick={onClose}>건너뛰기</button> : <span/>}
        <div>
          {step > 0 && <button className="guide-prev" onClick={()=>onStep(step-1)}>이전</button>}
          <button className="guide-next" onClick={()=>last ? onClose() : onStep(step+1)}>
            {last ? "BlueSync 시작하기" : "다음"} <ChevronRight size={17}/>
          </button>
        </div>
      </div>
    </section>
  </div>;
}

function Logo(){
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <Image className="bluesync-logo" src={`${basePath}/brand/bluesync-logo.png`} alt="BlueSync" width={430} height={120} priority/>;
}
function PageHead({eyebrow,title,desc}:{eyebrow:string;title:string;desc:string}){return <div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div><button className="icon-btn"><Bell size={19}/></button></div>}
function StatusBadge({status}:{status:Truck["status"]}){const [label,tone]=STATUS[status];return <span className={`badge ${tone}`}><i/>{label}</span>}

function DriverHome({truck,candidate,onSwap,onQueue,onRoute}:{truck:Truck;candidate:ReturnType<typeof findSwapCandidates>[0];onSwap:()=>void;onQueue:()=>void;onRoute:()=>void}) {
  const eta=estimateArrival(truck); const status=getArrivalStatus(truck.reservationTime,eta);
  return <><PageHead eyebrow="DRIVER DASHBOARD" title={`안녕하세요, ${maskPersonName(truck.driverName)} 기사님`} desc="오늘의 운행 일정과 항만 상황을 확인하세요."/>
    <section className="hero-card">
      <div className="hero-top"><div><span className="section-label">오늘의 예약</span><h2>{truck.terminalName}</h2><p><Container size={16}/>{truck.operationType==="IMPORT"?"수입 · 반입":"수출 · 반출"} <b>·</b> {truck.containerNumber}</p></div><StatusBadge status={status}/></div>
      <div className="time-line"><div><small>예약 시간</small><strong>{truck.reservationTime}</strong><span>2026. 07. 28</span></div><div className="route-line"><i/><span><TruckIcon size={20}/></span><i/></div><div className="accent"><small>예상 도착</small><strong>{eta}</strong><span>{truck.trafficLevel==="CONGESTED"?"교통 혼잡 반영":"현재 교통 반영"}</span></div></div>
      <div className="delay-callout"><span><Clock3 size={20}/></span><div><strong>예약보다 35분 늦게 도착할 예정이에요</strong><p>대기시간을 줄일 수 있는 예약 교환 후보를 찾았습니다.</p></div><button onClick={onSwap}>AI 추천 보기 <ChevronRight size={17}/></button></div>
      <div className="hero-actions"><button onClick={onSwap}><RefreshCw size={18}/>예약 교환 찾기</button><button onClick={onQueue}><ListFilter size={18}/>가상 대기 등록</button><button onClick={onRoute}><Route size={18}/>경로 확인</button></div>
    </section>
    <div className="metric-grid driver-metrics"><Metric icon={Clock3} label="예상 대기시간" value="68분" sub="혼잡 시간대"/><Metric icon={ListFilter} label="가상 대기 순번" value="12번째" sub="약 42분 후 호출"/></div>
    {candidate&&<section className="ai-strip"><span><Sparkles size={22}/></span><div><small>BLUESYNC AI</small><strong>더 빠른 방법을 찾았어요</strong><p>예약을 교환하면 두 차량의 총 대기시간을 <b>{candidate.savedMinutes}분</b> 줄일 수 있습니다.</p></div><button onClick={onSwap}>추천 확인</button></section>}
  </>;
}
function Metric({icon:Icon,label,value,sub}:{icon:typeof MapPin;label:string;value:string;sub:string}){return <article className="metric"><span><Icon size={19}/></span><small>{label}</small><strong>{value}</strong><p>{sub}</p></article>}

function SwapScreen({me,candidate,loading,onAccept,onReject,onNext}:{me:Truck;candidate:ReturnType<typeof findSwapCandidates>[0];loading:boolean;onAccept:()=>void;onReject:()=>void;onNext:()=>void}) {
 if(!candidate)return <Empty title="교환 가능한 차량이 없어요" body="가상 대기열에 등록하면 적절한 시점에 다시 알려드릴게요."/>;
 return <><PageHead eyebrow="AI RESERVATION SWAP" title="예약 교환 추천" desc="도착 예측과 항만 혼잡도를 분석해 가장 효율적인 교환을 찾았어요."/>
   <div className="impact-row"><div><small>총 대기시간 절감</small><strong>-{candidate.savedMinutes}분</strong></div><div><small>공회전 감소</small><strong>-{candidate.idleReductionMinutes}분</strong></div><div><small>예상 탄소배출 감소</small><strong>-{candidate.carbonReductionKg}kg</strong></div></div>
   <section className={`swap-card ${loading?"is-loading":""}`}>{loading&&<div className="swap-loader"><RefreshCw/><b>다음 교환 후보를 계산하고 있어요</b></div>}<div className="ai-title"><span><Sparkles size={19}/></span><div><small>AI 추천 · 매칭 정확도 {candidate.confidence}%</small><h2>서로의 빈 시간을 채우는 최적 교환</h2></div></div>
    <div className="truck-compare"><TruckCompare label="내 차량" truck={me}/><div className="swap-circle"><RefreshCw/></div><TruckCompare label="교환 차량" truck={candidate.truck}/></div>
    <div className="reason"><Zap size={19}/><p><b>왜 이 교환을 추천하나요?</b><br/>{candidate.reason}</p></div>
    <div className="calc-note">공회전 감소는 절감 대기시간의 58%, 탄소 감소는 디젤 공회전 분당 0.16kg 기준으로 계산한 예상치입니다.</div>
    <div className="swap-actions"><button className="primary" onClick={onAccept} disabled={loading}>교환 수락</button><button className="secondary" onClick={onReject} disabled={loading}>교환 거절</button><button className="text-btn" onClick={onNext} disabled={loading}>다른 교환 찾기</button></div>
   </section></>;
}
function TruckCompare({label,truck}:{label:string;truck:Truck}){return <article className="truck-box"><span>{label}</span><h3>{truck.truckNumber}</h3><p>{maskPersonName(truck.driverName)} · {truck.companyName}</p><dl><div><dt>기존 예약</dt><dd>{truck.reservationTime}</dd></div><div><dt>예상 도착</dt><dd>{truck.estimatedArrivalTime}</dd></div><div><dt>예상 대기</dt><dd>{truck.estimatedWaitingMinutes}분</dd></div></dl></article>}

function QueueScreen(){const spots=[{name:"부산항 신항 웅동 화물차휴게소",address:"경남 창원시 진해구 남문동 일원",lat:35.101,lng:128.759,note:"화물차 495면 규모"},{name:"웅동 화물차 섀시 주차장",address:"경남 창원시 진해구 남문동 1190-3",lat:35.104,lng:128.776,note:"섀시 약 250대"},{name:"부산신항국제터미널 PNIT",address:"부산 강서구 신항남로 330",lat:35.081,lng:128.8175,note:"호출 후 이동 목적지"}];return <><PageHead eyebrow="VIRTUAL QUEUE" title="가상 대기열" desc="항만 밖에서 편안하게 대기하고 호출 시간에 맞춰 출발하세요."/><section className="queue-hero"><div><small>현재 대기 순번</small><strong>12</strong><span>번째</span></div><div><small>예상 호출 시간</small><b>오전 11:42</b><p>약 42분 남음</p></div><div><small>터미널 혼잡도</small><b>높음</b><p>현재 38대 대기 중</p></div></section><div className="leave-alert"><Clock3/><div><b>호출 시간에 맞춰 항만으로 출발하세요</b><p>경로 확인에서 GPS 기반 예상 이동시간을 확인할 수 있습니다.</p></div></div><h2 className="subheading">실제 주변 대기 시설</h2><WaitingPlacesMap spots={spots}/><div className="place-list">{spots.map((s,i)=><article key={s.name}><span className="place-num">{i+1}</span><div><h3>{s.name}</h3><p><MapPin size={14}/>{s.address}</p></div><div className="amenities"><span>{s.note}</span></div><b className="free">지도 {i+1}</b></article>)}</div></>}
function AnalyticsScreen(){return <><PageHead eyebrow="EFFICIENCY ANALYTICS" title="운송 효율 분석" desc="예약 교환으로 줄어든 시간과 비용을 한눈에 확인하세요."/><div className="metric-grid analytics-metrics"><Metric icon={Clock3} label="이번 달 절감 대기시간" value="8시간 24분" sub="지난달 대비 18% 향상"/><Metric icon={TruckIcon} label="감소한 지각 운행" value="14건" sub="정시 도착률 92%"/><Metric icon={Gauge} label="줄어든 공회전" value="5시간 10분" sub="연료 약 41L 절감"/><Metric icon={Sparkles} label="교환 참여" value="9회" sub="성공률 100%"/></div><section className="chart-card"><div><h2>교환 전·후 평균 대기시간</h2><p>단위: 분</p></div><ResponsiveContainer width="100%" height={280}><BarChart data={analytics}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="before" name="교환 전" fill="#cbd5e1" radius={[6,6,0,0]}/><Bar dataKey="after" name="교환 후" fill="#0b7770" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></section></>}
function FleetScreen({trucks}:{trucks:Truck[]}){const [filter,setFilter]=useState("전체");const fs=trucks.filter(t=>filter==="전체"||STATUS[t.status][0].includes(filter));return <><PageHead eyebrow="FLEET CONTROL" title="차량 운행 현황" desc={`${trucks.length}대 차량의 예약과 도착 상태를 확인하세요.`}/><div className="filters">{["전체","정상","조기","지각","교환"].map(f=><button className={filter===f?"active":""} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="fleet-table"><div className="table-head"><span>차량 / 기사</span><span>터미널</span><span>예약</span><span>예상 도착</span><span>상태</span><span>대기</span></div>{fs.map(t=><div className="table-row" key={t.id}><span><b>{t.truckNumber}</b><small>{maskPersonName(t.driverName)} · {t.companyName}</small></span><span>{t.terminalName}</span><span>{t.reservationTime}</span><span>{t.estimatedArrivalTime}</span><span><StatusBadge status={t.status}/></span><span><b>{t.estimatedWaitingMinutes}분</b></span></div>)}</div></>}
function TerminalScreen({trucks}:{trucks:Truck[]}){const data=[{t:"08시",r:8,c:12},{t:"09시",r:14,c:16},{t:"10시",r:21,c:18},{t:"11시",r:17,c:19},{t:"12시",r:11,c:17},{t:"13시",r:16,c:20},{t:"14시",r:19,c:21}];return <><PageHead eyebrow="TERMINAL OPERATIONS" title="부산신항 운영 대시보드" desc="시간대별 예약 밀도와 처리 가능 차량을 비교합니다."/><div className="impact-row"><div><small>오늘 예약 차량</small><strong>{trucks.length * 4}대</strong></div><div><small>현재 지각 예상</small><strong>{trucks.filter(t=>t.status==="LATE").length}대</strong></div><div><small>AI 교환 완료</small><strong>7건</strong></div></div><section className="chart-card"><div><h2>시간대별 예약 · 처리 용량</h2><p>현재 10시 혼잡 구간입니다</p></div><ResponsiveContainer width="100%" height={310}><AreaChart data={data}><defs><linearGradient id="teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b7770" stopOpacity=".35"/><stop offset="100%" stopColor="#0b7770" stopOpacity=".02"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="t" axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="r" name="예약 차량" stroke="#0b7770" fill="url(#teal)" strokeWidth={3}/><Area type="monotone" dataKey="c" name="처리 가능" stroke="#e2a73b" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></section></>}
function Empty({title,body}:{title:string;body:string}){return <div className="empty"><RefreshCw/><h2>{title}</h2><p>{body}</p></div>}

function NotificationPanel({candidate,onOpenSwap,onClose}:{candidate:ReturnType<typeof findSwapCandidates>[0];onOpenSwap:()=>void;onClose:()=>void}) {
  return <div className="notification-panel">
    <div className="notification-head"><b>알림</b><button onClick={onClose}><X size={17}/></button></div>
    {candidate&&<button className="notification-item unread" onClick={onOpenSwap}><span><RefreshCw size={17}/></span><div><b>새 예약 교환 요청</b><p>{candidate.truck.truckNumber} 차량이 조기 도착 예정으로 예약 교환을 요청했습니다.</p><small>방금 전 · 절감 예상 {candidate.savedMinutes}분</small></div></button>}
    <div className="notification-item"><span><Clock3 size={17}/></span><div><b>지각 도착이 예상됩니다</b><p>현재 교통 상황을 반영하면 예약보다 늦게 도착할 가능성이 높습니다.</p><small>8분 전</small></div></div>
    <div className="notification-item"><span><ListFilter size={17}/></span><div><b>가상 대기 순번 안내</b><p>현재 12번째이며 약 42분 후 호출될 예정입니다.</p><small>15분 전</small></div></div>
  </div>
}

function RouteMapModal({onClose}:{onClose:()=>void}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const [routeInfo,setRouteInfo] = useState({distance:"18.4 km",duration:"약 28분"});
  const [gpsStatus,setGpsStatus] = useState("GPS 위치를 확인하고 있습니다…");
  const [startCoords,setStartCoords] = useState<[number,number]>([128.9420,35.1280]);

  useEffect(()=>{
    if(!mapEl.current) return;
    let disposed=false;
    let map:{remove:()=>void}|undefined;
    (async()=>{
      const L=await import("leaflet");
      if(disposed||!mapEl.current)return;
      let coords:[number,number]=[128.9420,35.1280];
      if("geolocation" in navigator){
        try{
          const position=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:10000,maximumAge:30000}));
          coords=[position.coords.longitude,position.coords.latitude];
          setStartCoords(coords);
          setGpsStatus(`GPS 실제 위치 · 정확도 약 ${Math.round(position.coords.accuracy)}m`);
        }catch{setGpsStatus("GPS 권한이 없어 데모 위치를 사용 중입니다");}
      }else setGpsStatus("GPS를 지원하지 않아 데모 위치를 사용 중입니다");
      const start:L.LatLngExpression=[coords[1],coords[0]];
      const end:L.LatLngExpression=[35.0810,128.8175];
      const leafletMap=L.map(mapEl.current,{zoomControl:true}).setView([35.105,128.88],12);
      map=leafletMap;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(leafletMap);
      const marker=(color:string)=>L.divIcon({className:"route-marker",html:`<span style="background:${color}"></span>`,iconSize:[24,24],iconAnchor:[12,12]});
      L.marker(start,{icon:marker("#087bff")}).addTo(leafletMap).bindPopup("현재 GPS 위치");
      L.marker(end,{icon:marker("#ff2d20")}).addTo(leafletMap).bindPopup("부산신항 PNIT");
      try{
        const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${coords[0]},${coords[1]};128.8175,35.0810?overview=full&geometries=geojson`);
        const data=await response.json();
        const route=data.routes?.[0];
        if(route){
          const points=route.geometry.coordinates.map(([lng,lat]:[number,number])=>[lat,lng] as [number,number]);
          const line=L.polyline(points,{color:"#087bff",weight:6,opacity:.9}).addTo(leafletMap);
          leafletMap.fitBounds(line.getBounds(),{padding:[30,30]});
          setRouteInfo({distance:`${(route.distance/1000).toFixed(1)} km`,duration:`약 ${Math.round(route.duration/60)}분`});
        } else L.polyline([start,end],{color:"#087bff",weight:6,dashArray:"10 8"}).addTo(leafletMap);
      }catch{L.polyline([start,end],{color:"#087bff",weight:6,dashArray:"10 8"}).addTo(leafletMap);}
    })();
    return()=>{disposed=true;map?.remove()};
  },[]);

  const naverUrl=`https://map.naver.com/p/directions/${startCoords[0]},${startCoords[1]},%ED%98%84%EC%9E%AC%20%EC%9C%84%EC%B9%98/128.8175,35.0810,%EB%B6%80%EC%82%B0%EC%8B%A0%ED%95%AD%20PNIT/-/car`;
  return <div className="route-modal-wrap" role="dialog" aria-modal="true" aria-label="항만 이동 경로">
    <section className="route-modal">
      <div className="route-modal-head"><div><small>실시간 추천 경로</small><h2>부산신항 PNIT 가는 길</h2></div><button onClick={onClose} aria-label="지도 닫기"><X/></button></div>
      <div ref={mapEl} className="route-map"/>
      <div className="gps-status"><span className="live-dot"/>{gpsStatus}</div>
      <div className="route-summary">
        <div><span>출발</span><b>현재 GPS 위치</b></div><i/><div><span>도착</span><b>부산신항 PNIT</b><small>강서구 신항남로 330</small></div>
      </div>
      <div className="route-stats"><div><small>예상 거리</small><strong>{routeInfo.distance}</strong></div><div><small>예상 시간</small><strong>{routeInfo.duration}</strong></div><div><small>교통 상태</small><strong>혼잡</strong></div></div>
      <a className="naver-route" href={naverUrl} target="_blank" rel="noreferrer">네이버지도에서 길안내 계속하기 <ChevronRight size={18}/></a>
    </section>
  </div>
}

function WaitingPlacesMap({spots}:{spots:{name:string;address:string;lat:number;lng:number;note:string}[]}) {
  const mapEl=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!mapEl.current)return;
    let disposed=false;
    let map:{remove:()=>void}|undefined;
    (async()=>{
      const L=await import("leaflet");
      if(disposed||!mapEl.current)return;
      const leafletMap=L.map(mapEl.current,{zoomControl:true,scrollWheelZoom:false}).setView([35.095,128.79],12);
      map=leafletMap;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(leafletMap);
      spots.forEach((spot,index)=>{
        const icon=L.divIcon({className:"waiting-marker",html:`<span>${index+1}</span>`,iconSize:[30,30],iconAnchor:[15,15]});
        L.marker([spot.lat,spot.lng],{icon}).addTo(leafletMap).bindPopup(`<b>${spot.name}</b><br>${spot.address}`);
      });
      leafletMap.fitBounds(spots.map(s=>[s.lat,s.lng] as [number,number]),{padding:[35,35]});
    })();
    return()=>{disposed=true;map?.remove()};
  },[spots]);
  return <div ref={mapEl} className="waiting-map" aria-label="부산신항 주변 대기 시설 지도"/>;
}
