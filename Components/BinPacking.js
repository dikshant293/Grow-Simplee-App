import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import baseURL from './baseURL';

function BinPacking({ route, navigation }) {

    const [packingDetails, setpackingDetails] = useState(false);
    const [renderList, setrenderList] = useState([])

    // Make side length of Bin Box 90% of Screen Size
    const sideLen = 0.9 * Dimensions.get('window').width;

    // Differnt contrasting colors for overlaping bin packages
    const colorCodes = ['#0EBC93', '#F5B700', '#DC0073', '#008BF8', '#F19C79', '#A44A3F', '#1A659E', '#EE4266', '#2A1E5C', '#C4CBCA', '#0D0E23',
                        '#0EBC93', '#F5B700', '#DC0073', '#008BF8', '#F19C79', '#A44A3F', '#1A659E', '#EE4266', '#2A1E5C', '#C4CBCA', '#0D0E23']

    // Get Bin packing data on page load
    useEffect(() => {
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        const getPackingDetails = () => fetch(`${baseURL}/v1/bin/details?route_id=${route.params["_id"]}`, requestOptions)
            .then(response => response.json())
            .then(result => {
                console.log("packing details fetched");
                // Sort the packages based on vertical position (y value) from bottom to top of the container
                result.bin.packages = result.bin.packages.sort((a, b) => (a.y > b.y) ? 1 : (a.y === b.y) ? ((a.x > b.x) ? 1 : (a.x === b.x) ? ((a.z > b.z) ? 1 : -1) : -1) : -1);
                const num_packages = result.bin.packages.length;
                if (num_packages > 0) {
                    // Setting colorCode 
                    result.bin.packages[0]["colorCode"] = 0;
                    tempCode = 0;
                    for (i = 1; i < num_packages; i++) {
                        // l1,l2 and r1,r2 are top left and bottom right coordinates of each package
                        l1 = {
                            x: result.bin.packages[i].x,
                            z: result.bin.packages[i].z
                        };
                        r1 = {
                            x: result.bin.packages[i].x + result.bin.packages[i].length,
                            z: result.bin.packages[i].z + result.bin.packages[i].breadth
                        };
                        // Checks rectangle 1 (l1,r1) against all alredy filled packages for overlap
                        for (j = 0; j < i; j++) {
                            l2 = {
                                x: result.bin.packages[j].x,
                                z: result.bin.packages[j].z
                            };
                            r2 = {
                                x: result.bin.packages[j].x + result.bin.packages[j].length,
                                z: result.bin.packages[j].z + result.bin.packages[j].breadth
                            };
                            // If overlaps then colorCode of the new is max + 1 code of the overlapping rectangles
                            if (doOverlap(l1, r1, l2, r2)) {
                                tempCode = Math.max(tempCode, result.bin.packages[j]["colorCode"] + 1);
                            }
                        }
                        result.bin.packages[i]["colorCode"] = tempCode;
                    }
                }
                setpackingDetails(result);
            })
            .catch(error => console.log('error', error));

        getPackingDetails();
    }, [])

    function doOverlap(l1, r1, l2, r2) {
        // If one rectangle is on left side of other
        if (l1.x >= r2.x || l2.x >= r1.x) {
            return false;
        }
        // If one rectangle is above other
        if (r1.z <= l2.z || r2.z <= l1.z) {
            return false;
        }
        return true;
    }

    // Get React Native Component proportional to the Package and bin size
    function getPackageView(params) {
        // horizontal axis: x axis and vertical axis: z
        // (0,0) at top left
        // lenght is x (width)
        // breadth is z (height)
        const lengthScale = (sideLen * 1.0) / params.bin_dimensions.length;
        const breadthScale = (sideLen * 1.0) / params.bin_dimensions.breadth;
        const compStyle = {
            position: "absolute",
            height: params.package.breadth * breadthScale,
            width: params.package.length * lengthScale,
            top: params.package.z * breadthScale,
            left: params.package.x * lengthScale,
            backgroundColor: colorCodes[params.package.colorCode],
            borderColor: "black",
            borderWidth: 1,
            opacity: 0.5,
            borderRadius: 5
        }
        console.log(params.package.colorCode, colorCodes[params.package.colorCode])
        return <TouchableOpacity onPress={() => alert("Package Details:\n" + JSON.stringify(params.package, null, 3))} key={params.package["package_id"]} style={compStyle} />
    }

    return (
        <ScrollView style={[styles.borderStyle, { backgroundColor: "white" }]}>
            <View style={[styles.borderStyle, styles.screenStyle]}>
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0D0E23', '#0EBC93']} style={[styles.borderStyle, styles.headerContainer]}>
                    <Text style={[styles.headerText]}>Bin Packing</Text>
                </LinearGradient>
            </View>
            {packingDetails ?
                <View style={{ width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", alignSelf: "center" }}>
                    <Text style={{ width: "70%", fontFamily: "Poppins-SemiBold", fontSize: 15 }}>{`Serial No. ${renderList.length}\nPackage ID: ${renderList.length !== 0 ? renderList[renderList.length - 1].key : "BIN EMPTY"}`}</Text>
                    <Image
                        style={{ alignSelf: "center", width: "30%", height: undefined, aspectRatio: 1 }}
                        source={require("./Images/bin-packing.gif")}
                    />
                </View>
                :
                <View />
            }
            {packingDetails ? <View style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <View style={[{ height: 0.9 * Dimensions.get('window').width, width: 0.9 * Dimensions.get('window').width, backgroundColor: 'white', borderRadius: 10, borderColor: "black", borderWidth: 2 }, styles.shadow]}>
                    {renderList}
                </View>
            </View> :
                <View />
            }
            {/* Back, Reset and Next in package list */}
            {packingDetails ?
                <View style={{ width: "90%", alignSelf: "center", display: "flex", justifyContent: "space-evenly", alignItems: "center", flexDirection: "row" }}>
                    <TouchableOpacity onPress={() => (renderList.length > 0 ? setrenderList(renderList.slice(0, renderList.length - 1)) : alert("Bin Empty!!"))}><Text style={{ fontSize: 90, fontFamily: "Poppins-Bold", color: "grey", textAlign: "center" }}>⇐</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setrenderList([])}><Text style={{ fontSize: 90, fontFamily: "Poppins-Bold", color: "grey", textAlign: "center" }}>↺</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => (renderList.length === packingDetails["bin"]["packages"].length ? alert("Bin Filled!!") : setrenderList([...renderList, getPackageView({ package: packingDetails["bin"]["packages"][renderList.length], bin_dimensions: packingDetails["bin"]["dimensions"] })]))}><Text style={{ fontSize: 90, fontFamily: "Poppins-Bold", color: "grey", textAlign: "center" }}>⇒</Text></TouchableOpacity>
                </View>
                :
                <View />
            }
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: "absolute", top: 0, left: 10 }}><Text style={{ color: "white", fontFamily: "Poppins-SemiBold", fontSize: 40, textAlign: "left", textAlignVertical: "top" }}>{"<"}</Text></TouchableOpacity>
        </ScrollView>
    );
}

export default BinPacking;

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
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 5,
    }
});