import type { Truck } from "../types";
import { timeToMinutes } from "./arrival-estimator";
export function findSwapCandidates(current:Truck,trucks:Truck[]){
 return trucks.filter(t=>t.id!==current.id&&t.terminalId===current.terminalId&&t.operationType===current.operationType&&t.vehicleType===current.vehicleType&&!["SWAP_COMPLETED","SWAP_PENDING"].includes(t.status))
 .map(truck=>{const currentDelay=Math.abs(timeToMinutes(current.estimatedArrivalTime)-timeToMinutes(current.reservationTime));const otherGap=Math.abs(timeToMinutes(truck.estimatedArrivalTime)-timeToMinutes(truck.reservationTime));const after=Math.abs(timeToMinutes(current.estimatedArrivalTime)-timeToMinutes(truck.reservationTime))+Math.abs(timeToMinutes(truck.estimatedArrivalTime)-timeToMinutes(current.reservationTime));return{truck,savedMinutes:Math.max(0,currentDelay+otherGap-after),score:(currentDelay+otherGap-after)*2+(current.urgentCargo?10:0)}})
 .filter(c=>c.savedMinutes>0).sort((a,b)=>b.score-a.score);
}
export function swapReservations(trucks:Truck[],a:string,b:string):Truck[]{const one=trucks.find(t=>t.id===a),two=trucks.find(t=>t.id===b);if(!one||!two)return trucks;return trucks.map(t=>t.id===a?{...t,reservationTime:two.reservationTime,status:"SWAP_COMPLETED" as const}:t.id===b?{...t,reservationTime:one.reservationTime,status:"SWAP_COMPLETED" as const}:t)}
