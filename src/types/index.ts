export type Role = "DRIVER" | "DISPATCHER" | "TERMINAL";
export type TrafficLevel = "SMOOTH" | "NORMAL" | "CONGESTED" | "ACCIDENT";
export type TruckStatus = "ON_TIME" | "EARLY" | "LATE" | "SWAP_RECOMMENDED" | "SWAP_PENDING" | "SWAP_COMPLETED";
export type Truck = {
  id:string; truckNumber:string; driverName:string; companyName:string; terminalId:string; terminalName:string;
  operationType:"IMPORT"|"EXPORT"; containerNumber:string; vehicleType:"GENERAL"|"REFRIGERATED"|"SPECIAL";
  reservationTime:string; estimatedArrivalTime:string; distanceKm:number; averageSpeedKmh:number;
  trafficLevel:TrafficLevel; estimatedWaitingMinutes:number; status:TruckStatus; urgentCargo:boolean; points:number;
};
