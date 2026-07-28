import type { Truck } from "../types";
export const initialTrucks: Truck[] = [
  {id:"T01",truckNumber:"부산 82바 1201",driverName:"김지윤",companyName:"세빛운송",terminalId:"PNIT",terminalName:"부산신항 PNIT",operationType:"IMPORT",containerNumber:"MSCU 7281934",vehicleType:"GENERAL",reservationTime:"10:00",estimatedArrivalTime:"10:35",distanceKm:18.4,averageSpeedKmh:42,trafficLevel:"CONGESTED",estimatedWaitingMinutes:68,status:"LATE",urgentCargo:true},
  {id:"T02",truckNumber:"부산 84아 8824",driverName:"이정훈",companyName:"동해물류",terminalId:"PNIT",terminalName:"부산신항 PNIT",operationType:"IMPORT",containerNumber:"TLLU 5528012",vehicleType:"GENERAL",reservationTime:"11:00",estimatedArrivalTime:"09:55",distanceKm:7.2,averageSpeedKmh:51,trafficLevel:"SMOOTH",estimatedWaitingMinutes:58,status:"EARLY",urgentCargo:false},
  {id:"T03",truckNumber:"경남 91아 3310",driverName:"박성진",companyName:"세빛운송",terminalId:"PNIT",terminalName:"부산신항 PNIT",operationType:"IMPORT",containerNumber:"OOLU 1938201",vehicleType:"GENERAL",reservationTime:"10:30",estimatedArrivalTime:"10:02",distanceKm:11,averageSpeedKmh:48,trafficLevel:"NORMAL",estimatedWaitingMinutes:42,status:"EARLY",urgentCargo:false},
];
