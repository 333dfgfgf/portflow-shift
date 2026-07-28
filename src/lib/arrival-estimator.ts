import type { TrafficLevel, Truck, TruckStatus } from "../types";
export const TRAFFIC_MULTIPLIER:Record<TrafficLevel,number>={SMOOTH:1,NORMAL:1.2,CONGESTED:1.5,ACCIDENT:1.8};
const minutes=(time:string)=>{const [h,m]=time.split(":").map(Number);return h*60+m};
const time=(total:number)=>`${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(Math.round(total%60)).padStart(2,"0")}`;
export function estimateArrival(truck:Truck){const travel=(truck.distanceKm/truck.averageSpeedKmh)*60*TRAFFIC_MULTIPLIER[truck.trafficLevel];const original=minutes(truck.estimatedArrivalTime);return time(original-travel*.18)}
export function getArrivalStatus(reservation:string,arrival:string):TruckStatus{const d=minutes(arrival)-minutes(reservation);if(d>=10)return"LATE";if(d<=-15)return"EARLY";return"ON_TIME"}
export const timeToMinutes=minutes;
