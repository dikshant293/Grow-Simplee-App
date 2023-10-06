import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import GetLocation from 'react-native-get-location'
import baseURL from './baseURL';

// API Key to access the Google Map's View Map
const GOOGLE_MAPS_APIKEY = '';

function ViewMapScreen({ route, navigation }) {
    // console.log(Object.keys(route.params.routeDetails))
    // console.log(route.params.routeDetails.route[0].coordinates)
    var coordinates = false;
    coordinates = [Object({ "latitude": route.params.routeDetails.warehouse.latitude * 1e-6, "longitude": route.params.routeDetails.warehouse.longitude * 1e-6, "address": route.params.routeDetails.warehouse.address, isPending: false, isWarehouse: true })]
        .concat(route.params.routeDetails.route.map(i => Object({ "latitude": i.coordinates.latitude * 1e-6, "longitude": i.coordinates.longitude * 1e-6, "address": i.coordinates.address, isPending: i.coordinates.isPending, isWarehouse: false })),
            [Object({ "latitude": route.params.routeDetails.warehouse.latitude * 1e-6, "longitude": route.params.routeDetails.warehouse.longitude * 1e-6, "address": route.params.routeDetails.warehouse.address, isPending: false, isWarehouse: true })]
        );
    // coordinates.forEach(i => {
    //     console.log(`(${i.longitude},${i.latitude})`)
    // })
    const [riderLocation, setriderLocation] = useState(false)
    const [totalDistance, settotalDistance] = useState(0);
    const [totalDuration, settotalDuration] = useState(0);

    const pendingColor = "#0EBC93";
    const completedColor = "#EE4266";
    const warehouseColor = "#1A659E";
    const riderColor = "#F5B700";

    // Get current location for current location marker
    // useEffect(() => {
    //     GetLocation.getCurrentPosition({
    //         enableHighAccuracy: true,
    //         timeout: 15000,
    //     })
    //         .then(location => {
    //             setriderLocation({ "latitude": location["latitude"], "longitude": location["longitude"] });
    //         })
    //         .catch(error => {
    //             const { code, message } = error;
    //             console.warn(code, message);
    //         })
    // }, [])

    // Get Simulated GPS Location
    useEffect(() => {
        console.log("rider GPS simulator initiated");
        coordInd = 0;
        numcoord = coordinates.length;
        intervalid = setInterval(() => {
            // setriderLocation({ "latitude": coordinates[coordInd].latitude, "longitude": coordinates[coordInd].longitude });
            // coordInd = (coordInd + 1) % numcoord;
            
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
            };

            fetch(`${baseURL}/v1/rider/location`, requestOptions)
                .then(response => response.json())
                .then(result => {
                    if ("rider" in result) {
                        result["rider"].forEach(i => {
                            if (i.id == route.params.rider_id) {
                                setriderLocation({ "latitude": i.coordinates.latitude * 1e-6, "longitude": i.coordinates.longitude * 1e-6 });
                            }
                        })
                    }
                })
                .catch(error => console.log('error', error));
        }, (3 * 1000));

        return () => {
            console.log("cleaning up rider sim");
            clearInterval(intervalid);
        }
    }, [])

    // Convert total duration of route in minutes to hours and minutes
    function timeConvert(n) {
        var num = Math.floor(n);
        var hours = (num / 60);
        var rhours = Math.floor(hours);
        var minutes = (hours - rhours) * 60;
        var rminutes = Math.round(minutes);
        return rhours + " hour(s) and " + rminutes + " minute(s)";
    }

    // Split coordinates for maps direction implementiation limit of maximum 25 waypoints
    function splitCoordinateArray(allcoordinates) {
        const chunkSize = 26;
        var renderList = [];
        var coordinateList = [];
        var ind = 0;
        for (let i = 0; i < allcoordinates.length; i += chunkSize) {
            coordinates = allcoordinates.slice(i, i + chunkSize + 1);
            coordinateList.push(coordinates);
            renderList.push(
                <MapViewDirections
                    key={`${i} coodinates`}
                    origin={coordinates[0]}
                    // start and end index as origin and destination and others as waypoints
                    waypoints={(coordinates.length > 2) ?
                        coordinates.slice(1, -1)
                        :
                        undefined}
                    destination={coordinates[coordinates.length - 1]}
                    apikey={GOOGLE_MAPS_APIKEY}
                    strokeWidth={3}
                    strokeColor="hotpink"
                    timePrecision='now'
                    // optimizeWaypoints={route.params.optimize}
                    onReady={result => {
                        // console.log(`Distance: ${result.distance} km`)
                        // console.log(`Duration: ${result.duration} min.`)
                        // console.log(totalDistance,totalDuration);
                        settotalDistance(curr => curr + result.distance)
                        settotalDuration(curr => curr + result.duration)
                    }}
                />
            );
            ind = ind + 1;
        }
        return renderList;
    }

    return (
        <View style={styles.container}>
            {coordinates ?
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: (Math.max(...coordinates.map(i => i.latitude)) + Math.min(...coordinates.map(i => i.latitude))) / 2.0,
                        longitude: (Math.max(...coordinates.map(i => i.longitude)) + Math.min(...coordinates.map(i => i.longitude))) / 2.0,
                        latitudeDelta: (Math.max(...coordinates.map(i => i.latitude)) - Math.min(...coordinates.map(i => i.latitude))) * 1.2,
                        longitudeDelta: (Math.max(...coordinates.map(i => i.longitude)) - Math.min(...coordinates.map(i => i.longitude))) * 1.2,
                    }}
                >
                    {coordinates.map((marker, index) => (
                        <Marker
                            key={index + 1}
                            coordinate={marker}
                            title={"Sl.No. " + JSON.stringify((marker.isWarehouse ? 0 : index))}
                            description={marker.address}
                            pinColor={marker.isWarehouse ? warehouseColor : (marker.isPending ? pendingColor : completedColor)}
                        />
                    ))}
                    {riderLocation ?
                        <Marker
                            key={"rider"}
                            coordinate={riderLocation}
                            title={"Rider Location"}
                            description={"Rider"}
                            pinColor={riderColor}
                        /> :
                        <View />
                    }
                    {coordinates ? splitCoordinateArray(coordinates) : <View />}
                </MapView> :
                <View />
            }
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: "absolute", top: 0, left: 10 }}><Text style={{ color: "black", fontFamily: "Poppins-SemiBold", fontSize: 40, textAlign: "left", textAlignVertical: "top" }}>{"<"}</Text></TouchableOpacity>
            {totalDistance ?
                <Text style={{ textAlign: "left", position: "absolute", right: 0, top: 0, fontFamily: "Poppins-SemiBold", fontSize: 12, backgroundColor: "white", borderRadius: 12, padding: 10 }}>{`Total Distance: ${totalDistance} km\nTotal Time: ${timeConvert(totalDuration)}`}</Text> :
                <View />
            }
            <View style={{ borderRadius: 12, display: "flex", flexDirection: "column", position: "absolute", bottom: 0, right: 0, backgroundColor: "white", padding: 10 }}>
                <Text style={{ alignSelf: "center", fontFamily: "Poppins-SemiBold", fontSize: 15 }}>Legend</Text>
                <View style={{ display: "flex", flexDirection: "row", padding: 2, alignSelf: "flex-end" }}>
                    <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, }}>Pending: </Text><View style={{ width: 15, backgroundColor: pendingColor, borderRadius: 5 }} />
                </View>
                <View style={{ display: "flex", flexDirection: "row", padding: 2, alignSelf: "flex-end" }}>
                    <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, }}>Completed: </Text><View style={{ width: 15, backgroundColor: completedColor, borderRadius: 5 }} />
                </View>
                <View style={{ display: "flex", flexDirection: "row", padding: 2, alignSelf: "flex-end" }}>
                    <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, }}>Warehouse: </Text><View style={{ width: 15, backgroundColor: warehouseColor, borderRadius: 5 }} />
                </View>
                <View style={{ display: "flex", flexDirection: "row", padding: 2, alignSelf: "flex-end" }}>
                    <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, }}>Rider: </Text><View style={{ width: 15, backgroundColor: riderColor, borderRadius: 5 }} />
                </View>
            </View>
        </View>
    );
}

export default ViewMapScreen;

const styles = StyleSheet.create({
    screenStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#FFFFFF",
        flexDirection: "column",
    },
    headerContainer: {
        height: 100,
        top: -50,
        borderRadius: 30,
        width: "105%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    headerText: {
        color: "white",
        fontFamily: 'Poppins-SemiBold',
        fontSize: 25,
        lineHeight: 40,
        textAlign: "center",
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});