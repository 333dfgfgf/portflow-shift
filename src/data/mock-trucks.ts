import type { Truck } from "../types";
const raw = [
["T01","부산 82바 1201","김도윤","한빛운송","PNIT","부산신항 PNIT","IMPORT","MSCU 7281934","GENERAL","10:00","10:35",18.4,42,"CONGESTED",68,"LATE",true,1240],
["T02","부산 84사 8824","이정우","동해물류","PNIT","부산신항 PNIT","IMPORT","TLLU 5528012","GENERAL","11:00","09:55",7.2,51,"SMOOTH",58,"EARLY",false,860],
["T03","경남 91아 3310","박성진","한빛운송","PNIT","부산신항 PNIT","IMPORT","OOLU 1938201","GENERAL","10:30","10:02",11,48,"NORMAL",42,"EARLY",false,510],
["T04","부산 80자 7162","최민석","대양로지스","BCT","부산항 BCT","EXPORT","HLCU 9033218","SPECIAL","09:30","09:26",4,38,"NORMAL",18,"ON_TIME",true,930],
["T05","울산 86바 4028","장현수","세진운송","BCT","부산항 BCT","EXPORT","MAEU 1084729","GENERAL","10:00","10:48",23,36,"ACCIDENT",81,"LATE",false,720],
["T06","경남 89사 5519","한재욱","금강물류","PNC","부산신항 PNC","IMPORT","COSU 6601842","REFRIGERATED","11:30","10:47",13,49,"SMOOTH",49,"EARLY",true,1160],
["T07","부산 93아 2204","윤태호","한빛운송","PNIT","부산신항 PNIT","IMPORT","SEGU 3119087","GENERAL","11:00","10:53",8,44,"NORMAL",23,"ON_TIME",false,420],
["T08","경남 88자 1902","오상훈","대양로지스","PNC","부산신항 PNC","EXPORT","ONEU 8401275","GENERAL","12:00","12:31",19,40,"CONGESTED",64,"LATE",false,600],
["T09","부산 81바 6377","문지혁","세진운송","BCT","부산항 BCT","IMPORT","CMAU 7319205","SPECIAL","12:30","11:54",15,52,"SMOOTH",44,"EARLY",false,780],
["T10","울산 90사 8155","서동욱","금강물류","PNIT","부산신항 PNIT","IMPORT","TEMU 5512370","GENERAL","13:00","12:58",6,41,"NORMAL",16,"ON_TIME",false,350],
["T11","경남 87아 9034","배진호","동해물류","PNC","부산신항 PNC","EXPORT","APZU 2084119","REFRIGERATED","13:30","13:12",10,45,"NORMAL",31,"SWAP_RECOMMENDED",true,980],
["T12","부산 85자 4421","강승민","대양로지스","BCT","부산항 BCT","EXPORT","WHLU 6910872","GENERAL","14:00","13:59",9,47,"NORMAL",17,"SWAP_COMPLETED",false,1320]
] as const;
export const initialTrucks: Truck[] = raw.map(r=>({id:r[0],truckNumber:r[1],driverName:r[2],companyName:r[3],terminalId:r[4],terminalName:r[5],operationType:r[6],containerNumber:r[7],vehicleType:r[8],reservationTime:r[9],estimatedArrivalTime:r[10],distanceKm:r[11],averageSpeedKmh:r[12],trafficLevel:r[13],estimatedWaitingMinutes:r[14],status:r[15],urgentCargo:r[16],points:r[17]}));
