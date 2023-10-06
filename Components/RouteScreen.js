import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import baseURL from './baseURL';
import getDirections from 'react-native-google-maps-directions'


function RouteScreen({ route, navigation }) {
    const [routeDetails, setrouteDetails] = useState(false)
    const [showPending, setshowPending] = useState(true)
    const [refreshing, setRefreshing] = useState(false);
    const [isEditEnabled, setisEditEnabled] = useState(false)

    // Open Google Maps navigation to given latitude longitude based location
    const handleGetDirections = (params) => {
        const data = {
            destination: {
                latitude: params['latitude'] * 1e-6,
                longitude: params['longitude'] * 1e-6
            },
            params: [
                {
                    key: "travelmode",
                    value: "driving"        // may be "walking", "bicycling" or "transit" as well
                },
            ]
        }
        console.log(data);
        getDirections(data);
    }

    // Get list of delivery/pickup points from API and store in React State
    function getList() {
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        return fetch(`${baseURL}/v1/route/details?route_id=${route.params["route_id"]}`, requestOptions)
            .then(response => response.json())
            .then(result => {
                console.log("Route details fetched");
                result["route"].forEach((i, ind) => { i["show"] = false; i["index"] = ind })
                setrouteDetails(result);
            })
            .catch(error => console.log('error - route fetching', error));
    }

    // Fetch details on initial page load
    useEffect(() => {
        getList();
    }, [])

    // Notification checker pings backend every 5 seconds
    useEffect(() => {
        console.log("notification checker initiated");
        intervalid = setInterval(() => {
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
            };

            fetch(`${baseURL}/v1/util/notif/rider?rider_id=${route.params["rider_id"]}`, requestOptions)
                .then(response => response.json())
                .then(result => {
                    console.log(result);
                    const x = new Date();
                    let message = `Notification(s) at ${x.toLocaleTimeString()}`;
                    if (("notifs" in result) && result.notifs.length > 0) {
                        result.notifs.forEach(msg => {
                            message = message + `\n\n${msg.message}`;
                        })
                        if(!isEditEnabled) getList();
                        alert(message);
                    }
                })
                .catch(error => console.log('error - notification fetch', error));
        }, (5 * 1000));

        return () => {
            console.log("cleaning up notification checker");
            clearInterval(intervalid);
        }
    }, [])

    // Pull down to refresh the route list
    const onRefresh = useCallback(() => {
        getList();
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    function countPending(params) {
        if (params) {
            const count = params["route"].map(i => i["packages"][0]["latest_status"]).filter(i => {
                if (i !== "DELIVERED" && i !== "PICKED" && i !== "FAKE ATTEMPT") return true
                else return false
            }).length;
            return count;
        }
        else return "--";
    }

    // Mark/Unmark delivery/pickup
    function updateStatus(params) {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        // Update status of all the packages for the delivery/pickup location
        Promise.all(params.packages.map(i => {
            var raw = JSON.stringify({
                "status": params.status,
                "package_id": i["_id"],
                "rider_id": params.rider_id
            });
            var requestOptions = {
                method: params.isunmark ? 'PATCH' : 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };
            return fetch(`${baseURL}/v1/status/${params.isunmark ? 'unmark' : 'update'}`, requestOptions)
                .then(response => response.json())
                .then(result => console.log(result))
                .catch(error => console.log('error - mark/unmark status update', error));
        }))
            // Update whole list after Mark/Unmark completed
            .then(() => getList())
    }

    function moveup(index) {
        swapInd = -1;
        for (i = index - 1; i >= 0; i--) {
            if (isPending({ status: routeDetails.route[i].packages[0].latest_status })) {
                swapInd = i;
                break;
            }
        }
        if (swapInd != -1) {
            setrouteDetails(tempState => {
                temp = { ...tempState.route[swapInd], "index": index };
                tempState.route[swapInd] = { ...tempState.route[index], "index": swapInd };
                tempState.route[index] = temp;
                return { ...tempState };
            });
        }
    }

    function movedown(index) {
        swapInd = -1;
        num_locations = routeDetails.route.length;
        for (i = index + 1; i < num_locations; i++) {
            if (isPending({ status: routeDetails.route[i].packages[0].latest_status })) {
                swapInd = i;
                break;
            }
        }
        if (swapInd != -1) {
            setrouteDetails(tempState => {
                temp = { ...tempState.route[swapInd], "index": index };
                tempState.route[swapInd] = { ...tempState.route[index], "index": swapInd };
                tempState.route[index] = temp;
                return { ...tempState };
            });
        }
    }

    // Display the task at a particular location
    function taskBox(params) {
        return <TouchableOpacity onPress={() => {
            setrouteDetails({ ...routeDetails, "route": routeDetails["route"].map(i => (i === params ? { ...i, "show": !params["show"] } : i)) })
        }} style={[styles.taskContainer]} key={`task-${params["coordinates"]["address"]}`}>
            <View style={[{ width: "100%", alignSelf: "center", display: "flex", flexDirection: "row" }, params["show"] ? { borderBottomWidth: 1, paddingBottom: 5, borderColor: "grey", marginBottom: 5 } : {}]}>
                {isEditEnabled && showPending ? <View style={{ width: "10%", display: "flex", borderRightWidth: 1, marginRight: 10, paddingRight: 10 }}>
                    <TouchableOpacity onPress={() => moveup(params.index)} style={{ borderRadius: 10, marginBottom: 3, backgroundColor: "red" }}><Text style={{ color: "white", alignSelf: "center", fontSize: 25, fontWeight: "bold" }}>{"↑"}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => movedown(params.index)} style={{ borderRadius: 10, marginBottom: 3, backgroundColor: "green" }}><Text style={{ color: "white", alignSelf: "center", fontSize: 25, fontWeight: "bold" }}>{"↓"}</Text></TouchableOpacity>
                </View> : <View />}
                <Text style={[{ width: isEditEnabled ? "80%" : "90%" }, styles.taskText]}>{params["coordinates"]["address"]}</Text>
                <Text style={[styles.taskText, { alignSelf: "flex-end", justifyContent: "center", alignSelf: "center", fontSize: 30 }]}>{params["show"] ? "⇓" : "⇒"}</Text>
            </View>
            {params["show"] ? <View style={[{ width: "95%", display: "flex", justifyContent: "space-between", flexDirection: "row" }, styles.borderStyle]}>
                <View style={[{ display: "flex" }, styles.borderStyle]}>
                    {params["packages"].map(i =>
                        <View key={`package-${i["deliver_to"]["phone_number"]}`} style={[{ display: "flex" }]}>
                            <Text style={styles.packageDetail}>{i["deliver_to"]["name"]}</Text>
                            <Text style={[styles.packageDetail, { textDecorationLine: "underline" }]}
                                onPress={() => Linking.openURL(`tel:${i["deliver_to"]["phone_number"]}`)}
                            >{`Phone: ${i["deliver_to"]["phone_number"]}`}
                            </Text>
                            <Text style={[styles.packageDetail]}>{`Total Packages: ${params["packages"].length}`}</Text>
                            <Text style={styles.packageDetail}>{`Status: ${i["latest_status"]}`}</Text>
                            <Text style={[styles.packageDetail, { textDecorationLine: "underline" }]}
                                onPress={() => navigation.navigate("Package Screen", { packages: params['packages'] })}
                            >View Packages
                            </Text>
                            <Text> </Text>
                        </View>
                    )}
                </View>
                <View style={[{ display: "flex", justifyContent: "flex-start", alignItems: "center" }, styles.borderStyle]}>
                    <TouchableOpacity style={{ marginBottom: 10 }} onPress={() => updateStatus({
                        isunmark: params["packages"][0]["latest_status"] === "DELIVERED" || params["packages"][0]["latest_status"] === "PICKED" || params["packages"][0]["latest_status"] === "FAKE ATTEMPT",
                        rider_id: routeDetails["rider"]["_id"],
                        packages: params["packages"],
                        status: params["packages"][0]["latest_status"] === "DELIVERED" || params["packages"][0]["latest_status"] === "PICKED" || params["packages"][0]["latest_status"] === "FAKE ATTEMPT" ? "OUT_FOR_DELIVERY" : (params["packages"][0]["type"] === "DELIVERY" ? "DELIVERED" : "PICKED")
                    })}>
                        <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']} style={{ borderRadius: 13, padding: 9 }}>
                            <Text style={{ textAlign: "center", fontFamily: "Poppins-SemiBold", fontSize: 14, color: "white" }}>{`${params["packages"][0]["latest_status"] === "DELIVERED" || params["packages"][0]["latest_status"] === "PICKED" || params["packages"][0]["latest_status"] === "FAKE ATTEMPT" ? "Unmark" : "Mark"} \n${params["packages"][0]["type"] === "DELIVERY" ? "Delivery" : " Pickup "}`}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginBottom: 10 }} onPress={() => handleGetDirections(params["coordinates"])}>
                        <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']} style={{ borderRadius: 13, padding: 9 }}>
                            <Text style={{ textAlign: "center", fontFamily: "Poppins-SemiBold", fontSize: 14, color: "white" }}>Go Here</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
                : <View />
            }
        </TouchableOpacity>
    }

    // Check whether a location be displayed or not based on if its still pending or not and the column selected by user 
    function shouldRender(params) {
        if (showPending) {
            if (params.status !== "DELIVERED" && params.status !== "PICKED" && params.status !== "FAKE ATTEMPT") return true
            else return false
        }
        else {
            if (params.status === "DELIVERED" || params.status === "PICKED" || params.status === "FAKE ATTEMPT") return true
            else return false
        }
    }

    // Check if a delivery/pickup is still pending
    function isPending(params) {
        if (params.status !== "DELIVERED" && params.status !== "PICKED" && params.status !== "FAKE ATTEMPT") return true
        else return false
    }



    return (
        <View style={{ position: "absolute", top: 0, bottom: 0, right: 0, left: 0 }}>
            <ScrollView style={[{ backgroundColor: "white" }]}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>
                <View style={[styles.screenStyle]}>
                    <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0D0E23', '#0EBC93']} style={[styles.headerContainer]}>
                        {routeDetails ?
                            <View style={{ position: "absolute", bottom: 0, display: "flex" }}>
                                <Text style={[styles.headerText]}>Route Details</Text>
                                <Text style={[styles.headerText, { fontSize: 18, fontFamily: "Poppins-Regular" }]}>{`Total Tasks: ${routeDetails["number_points"]}`}</Text>
                                <Text style={[styles.headerText, { fontSize: 18, fontFamily: "Poppins-Regular" }]}>{`Total Packages: ${routeDetails["number_points"]}`}</Text>
                            </View>
                            :
                            <Text style={[styles.headerText]}>Route Details</Text>
                        }
                    </LinearGradient>

                    <View style={{ display: "flex", justifyContent: 'center', marginTop: 10, width: "80%" }}>
                        <Text style={{ alignSelf: "center", fontFamily: "Poppins-SemiBold", fontSize: 18, color: "black" }}>{`Pending Tasks: ${countPending(routeDetails)}`}</Text>
                        <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", width: "100%" }}>
                            <TouchableOpacity style={{ margin: 2 }} onPress={() => {
                                if ((isEditEnabled)) {
                                    var myHeaders = new Headers();
                                    myHeaders.append("Content-Type", "application/json");

                                    let paths = [];
                                    routeDetails.route.forEach(i => {
                                        i.packages.forEach(j => {
                                            paths.push(j["_id"]);
                                        });
                                    })
                                    var raw = JSON.stringify({
                                        route_id: route.params["route_id"],
                                        paths: paths
                                    });

                                    var requestOptions = {
                                        method: 'PATCH',
                                        headers: myHeaders,
                                        body: raw,
                                        redirect: 'follow'
                                    };

                                    fetch(`${baseURL}/v1/route/update`, requestOptions)
                                        .then(response => response.json())
                                        .then(result => {
                                            console.log("route updated");
                                            getList();
                                            setisEditEnabled(false);
                                        })
                                        .catch(error => alert('error - route update', error));
                                }
                                else{
                                    setisEditEnabled(true)
                                }
                            }}>
                                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={isEditEnabled ? ["#24a0ed", "#24a0ed"] : ['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']} style={{ borderRadius: 13, padding: 9 }}>
                                    <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 16, color: "white", textAlign: "center" }}>{isEditEnabled ? "Save" : "Edit Route"}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            {isEditEnabled ?
                                <TouchableOpacity style={{ margin: 2 }} onPress={() => {
                                    getList().then(result =>
                                        setisEditEnabled(!isEditEnabled)
                                    );
                                }}>
                                    <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={["#c70000", "#c70000"]} style={{ borderRadius: 13, padding: 9 }}>
                                        <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 16, color: "white", textAlign: "center" }}>Cancel</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                : <View />
                            }
                            <TouchableOpacity style={{ margin: 2 }} onPress={() =>{
                                    let temp = routeDetails;
                                    // console.log(Object.keys(temp))
                                    temp.route.forEach(i => {
                                        i.coordinates["isPending"]=isPending({ status: i["packages"][0]["latest_status"] });
                                    })
                                    navigation.navigate("View Map", { routeDetails: temp, optimize: !showPending, rider_id: route.params["rider_id"]})
                                }}>
                                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']} style={{ borderRadius: 13, padding: 9 }}>
                                    <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 16, color: "white", textAlign: "center" }}>View Map</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.switchContainer}>
                        <TouchableOpacity onPress={() => setshowPending(true)} style={showPending ? styles.switchSubBoxSelected : styles.switchSubBoxNotSelected}>
                            <Text style={[styles.headerText, { color: "black", fontSize: 15, fontFamily: "Poppins-Regular" }]}>Pending</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setshowPending(false)} style={showPending ? styles.switchSubBoxNotSelected : styles.switchSubBoxSelected}>
                            <Text style={[styles.headerText, { color: "black", fontSize: 15, fontFamily: "Poppins-Regular" }]}>Completed</Text>
                        </TouchableOpacity>
                    </View>
                    {routeDetails ?
                        routeDetails["route"].map(i => {
                            // Display only the pending/completed tasks based on column selected
                            return shouldRender({ status: i["packages"][0]["latest_status"] }) ?
                                taskBox(i) : <View key={`task-${i["coordinates"]["address"]}`}></View>
                        })
                        : <Text>Loading...</Text>}
                </View>
                {routeDetails && showPending && countPending(routeDetails) === 0 ? <Text style={{ alignSelf: "center", textAlign: "center", fontFamily: "Poppins-SemiBold", fontSize: 25, marginTop: 100, opacity: 0.7 }}>👏 Route Competed !!!👏</Text> : <View />}
                <View style={{height:70}}/>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: "absolute", top: 0, left: 10 }}><Text style={{ color: "white", fontFamily: "Poppins-SemiBold", fontSize: 40, textAlign: "left", textAlignVertical: "top" }}>{"<"}</Text></TouchableOpacity>
            </ScrollView >
            {routeDetails && showPending && countPending(routeDetails) !== 0 ?
                <View style={{ bottom: 10 }}>
                    <TouchableOpacity activeOpacity={0.9} style={[styles.startNavContainer]}
                        onPress={() => {
                            // Start Naviagtion to sequntially next pending delivery/pickup location
                            for (let i = 0; i < routeDetails["route"].length; i++) {
                                const element = routeDetails["route"][i];
                                if (isPending({ status: element["packages"][0]["latest_status"] })) {
                                    handleGetDirections(element["coordinates"]);
                                    break;
                                }
                            }
                        }}>
                        <LinearGradient style={[styles.startNavContainer, { width: "100%" }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']}>
                            <Text style={styles.startNavText}>Start Navigation</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                :
                <View />
            }
        </View>
    );
}

export default RouteScreen;

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
        height: 180,
        top: -50,
        borderRadius: 80,
        width: "105%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginBottom: -50
    },
    headerText: {
        color: "white",
        fontFamily: 'Poppins-SemiBold',
        fontSize: 30,
        lineHeight: 40,
        textAlign: "center",
    },
    borderStyle: {
        // borderColor:"red",
        // borderWidth:1
    },
    taskContainer: {
        width: "90%",
        margin: 10,
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    taskText: {
        color: "black",
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        alignSelf: "flex-start"
    },
    packageDetail: {
        fontSize: 14,
        fontFamily: "Poppins-Regular",
    },
    switchContainer: {
        width: "80%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 100,
        backgroundColor: "#bdbbbb",
        margin: 10,
        padding: 2
    },
    switchSubBoxSelected: {
        width: "50%",
        backgroundColor: "#f6f6f6",
        borderRadius: 100,
    },
    switchSubBoxNotSelected: {
        width: "50%",
    },
    startNavContainer: {
        borderRadius: 100,
        width: "90%",
        height: 51,
        position: "absolute",
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center"
    },
    startNavText: {
        textAlign: 'center',
        color: "white",
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
        width: "100%"
    }
});