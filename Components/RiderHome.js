import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler, RefreshControl, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import baseURL from './baseURL';
import GetLocation from 'react-native-get-location'
import * as Keychain from "react-native-keychain";
import { CommonActions, useFocusEffect } from '@react-navigation/native';

function RiderHome({ route, navigation }) {
    const [routeList, setrouteList] = useState([])
    const [refreshing, setRefreshing] = useState(false);

    // Disable hardware Backpress event to prevent unintentional logout
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );
    
    // Pulldown to refresh route list
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
          setRefreshing(false);
        }, 2000);
        console.log(route.params["riderDetails"]["_id"])
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        const getList = () => fetch(`${baseURL}/v1/route/list?rider_id=${route.params["riderDetails"]["_id"]}`, requestOptions)
            .then(response => response.json())
            .then(result => {
                console.log("Route list fetched");
                setrouteList(result["routes"]);
            })
            .catch(error => console.log('error', error));

        getList();
      }, []);

    // Get current time and date
    const dateObj = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    // Remove credentials if on Logout event by user
    Keychain.getGenericPassword().then(result => {
        console.log("stored creds: ", result)
    })

    // Rider GPS Tracking service sends current location to backend using
    // POST API at every 30 seconds
    const sendLocation = () => GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
    })
        .then(location => {
            const x = new Date()
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            var raw = JSON.stringify({
                "rider_id": route.params["riderDetails"]["_id"],
                "coordinates": {
                    "latitude": location["latitude"] * 1e6,
                    "longitude": location["longitude"] * 1e6
                }
            });

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };

            fetch(`${baseURL}/v1/rider/location`, requestOptions)
                .then(response => response.json())
                .then(result => console.log("Location sent"))
                .catch(error => console.log('error', error));
        })
        .catch(error => {
            const { code, message } = error;
            console.warn(code, message);
        })
    
    // Initiate the GPS tracking service on page load 
    useEffect(() => {
        console.log("location effect initiated");
        intervalid = setInterval(() => {
            sendLocation();
        }, (30 * 1000));

        return () => {
            console.log("cleaning up location updater");
            clearInterval(intervalid);
        }
    }, [])

    // Fetch Route List for rider and store in React State
    useEffect(() => {
        console.log(route.params["riderDetails"]["_id"])
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        const getList = () => fetch(`${baseURL}/v1/route/list?rider_id=${route.params["riderDetails"]["_id"]}`, requestOptions)
            .then(response => response.json())
            .then(result => {
                console.log("Route list fetched");
                setrouteList(result["routes"]);
            })
            .catch(error => console.log('error', error));

        getList();
    }, [])

    // Function for Rider Bio Display
    function RiderBio(params) {
        return <View style={[styles.borderStyle, { paddingTop:100/2,paddingBottom: 10, borderColor: "grey", borderBottomWidth: 2, marginBottom: 20 }]}>
            <Text style={{ textAlign: "center", fontFamily: 'Poppins-Bold', fontSize: 25, }}>{params["riderDetails"]["name"]}</Text>
            <Text style={{ textAlign: "center", fontFamily: 'Poppins-Regular', fontSize: 15, }}>{params["riderDetails"]["phone"]}</Text>
            <Text style={{ textAlign: "center", fontFamily: 'Poppins-Regular', fontSize: 15, }}>{params["riderDetails"]["email"]}</Text>
            <Text style={{ textAlign: "center", fontFamily: 'Poppins-Regular', fontSize: 15, }}>{params["riderDetails"]["_id"]}</Text>
        </View>
    }

    // Function to display details for each route in route list of rider
    function RouteBox(params) {
        const createdAtTime = new Date(params["createdAt"]).toLocaleString("en-IN");
        return <View key={`route-${params["_id"]}`} style={[styles.borderStyle, styles.routeBoxContainer]}>
            <TouchableOpacity style={[styles.routeBoxStyle]}
                onPress={() => {
                    navigation.navigate("Route Screen", { route_id: params["_id"], rider_id: route.params["riderDetails"]["_id"]});
                }}>
                <View style={{borderBottomWidth:1,borderBottomColor:"grey",paddingBottom:5,marginBottom:5}}>
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, }}>{`Route ID: ${params["_id"]}`}</Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, }}>{`Number of Points: ${params["number_points"]}`}</Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, }}>{`Number of Pacakages: ${params["number_packages"]}`}</Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, }}>{`Created At: ${createdAtTime}`}</Text>
                </View>
                <Text style={{ fontFamily: 'Poppins-MediumItalic', fontSize: 16, alignSelf:"center" }}>{`Press To Start Route...`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.binPackingContainer]}
                onPress={() => {
                    navigation.navigate("Bin Packing", { _id: params["_id"] })
                }}>
                <LinearGradient style={[styles.binPackingContainer, { width: "100%" }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']}>
                    <Text style={styles.binPackingText}>Bin Packing</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    }

    return (
        <ScrollView style={[styles.borderStyle, { backgroundColor: "white" }]}
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
            <View style={[styles.borderStyle, styles.screenStyle]}>
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0D0E23', '#0EBC93']} style={[styles.borderStyle, styles.headerContainer]}>
                    <View style={{display:"flex",justifyContent:"flex-end",height:200}}>
                        <Text style={[styles.headerText]}>Profile</Text>
                        <View style={{marginTop:-50,bottom:-50,width:125,height:125,borderRadius:125/2,backgroundColor:"red", display:"flex",justifyContent:"center",alignItems:"center"}}>
                            <Image
                                style={{width:125,height:undefined,aspectRatio:1}}
                                source={require('./Images/profilepic.png')}
                            />
                        </View>
                    </View>
                </LinearGradient>
                {RiderBio(route.params)}
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18, textAlign: "center" }}>{`Today's Routes:\n${dateObj.toLocaleDateString(undefined, options)}`}</Text>
                {routeList.length > 0 ? routeList.map(i => RouteBox(i)) : <Text style={{ alignSelf: "center", textAlign: "center", fontFamily: "Poppins-SemiBold", fontSize: 25, marginTop: 100, opacity: 0.7 }}>👏 All Routes Competed !!!👏</Text>}
            </View>
            <TouchableOpacity onPress={() => {
                Keychain.resetGenericPassword().then(res => {
                    console.log("creds removed")
                    navigation.dispatch(
                        CommonActions.navigate({
                            name: 'Login',
                        })
                    );
                })
            }} style={{ position: "absolute", top: 11, right: 10 }}><Text style={{ color: "white", fontFamily: "Poppins-Regular", fontSize: 18, textAlign: "left", right: 0, textAlignVertical: "top" }}>{"Logout"}</Text></TouchableOpacity>
        </ScrollView>
    );
}

export default RiderHome;

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
        // height: 500,
        top: -50,
        borderRadius: 30,
        width: "105%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginBottom: -40
    },
    headerText: {
        color: "white",
        fontFamily: 'Poppins-SemiBold',
        fontSize: 25,
        lineHeight: 40,
        textAlign: "center",
    },
    borderStyle: {
        // borderColor:"black",
        // borderWidth:2
    },
    routeBoxContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: 20
    },
    routeBoxStyle: {
        width: "80%",
        borderWidth: 1,
        borderColor: "black",
        borderRadius: 12,
        padding: 10,
        margin: 10
    },
    binPackingContainer: {
        borderRadius: 100,
        width: "80%",
        height: 51,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    binPackingText: {
        textAlign: 'center',
        color: "white",
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
        width: "100%"
    }
});