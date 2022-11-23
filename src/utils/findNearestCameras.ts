import camObj from "../types/camObj"
import updatedCamObj from "../types/updatedCamObj"

const getPosition = () => {                         //Simulate getting user's position
    const lat: number = 12.9 + Math.random() / 10
    const lng: number = 80.2 + Math.random() / 10
    return [lat, lng]
}

const getGeoDistance = (lat1: number, lat2: number, lng1: number, lng2: number) => {            //Function to calculate distance between two geolocations
    lat1 = lat1 / 57.29577951;              // convert to radians
    lat2 = lat2 / 57.29577951
    lng1 = lng1 / 57.29577951
    lng2 = lng2 / 57.29577951

    const dlong: number = lng2 - lng1;              // Haversine Formula
    const dlat: number = lat2 - lat1;

    let dist = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlong / 2), 2);
    dist = 2 * Math.asin(Math.sqrt(dist));
    dist = dist * 6371;                 // Radius of the earth in km
    return dist;
}

const findNearestCameras = (cameras: camObj[]) => {

    // Function to calculate distance between user's position and all cameras and 
    // returns an array containing 10 nearest cameras with distance

    // const [lat1, lng1]: number[] = getPosition()
    const [lat1, lng1]: number[] = [12.987310959293936, 80.23900588291403]        // Ganga 366 geolocation 
    const updatedCamData = cameras.map((cam) => {
        const [lat2, lng2]: number[] = [Number(JSON.parse(cam.camPosition).latitude), Number(JSON.parse(cam.camPosition).longitude)]
        const distance: number = getGeoDistance(lat1, lat2, lng1, lng2)
        return { camName: cam.camName, camPosition: cam.camPosition, camBuilding: cam.camBuilding, camCount: cam.camCount, distance: distance }
    })
    updatedCamData.sort((a: updatedCamObj, b: updatedCamObj) => a.distance - b.distance)
    return updatedCamData.slice(0, 10)
    
}

export default findNearestCameras