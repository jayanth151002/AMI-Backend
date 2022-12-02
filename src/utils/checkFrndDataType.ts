import frndDataType from "../types/frndData";

export default function checkFrndDataType(frndData: any):frndData is frndDataType {
  if (typeof frndData.fName === "string" && typeof frndData.fPhNo === "string" && typeof frndData.fRollNo === "string") {
    return true;
  }
  return false;
}