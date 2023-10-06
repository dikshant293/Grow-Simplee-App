import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

function PackageScreen({ route, navigation }) {
    // Display details of all packages
    return (
        <ScrollView style={[styles.borderStyle, { backgroundColor: "white" }]}>
            <View style={[styles.borderStyle, styles.screenStyle]}>
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0D0E23', '#0EBC93']} style={[styles.borderStyle, styles.headerContainer]}>
                    <Text style={[styles.headerText]}>Package Details</Text>
                </LinearGradient>
                {route.params.packages.map(i =>
                    <View key={i["sku_id"]} style={{ width: "90%", display: "flex", justifyContent: "center", alignItems: "center", borderWidth: 1, padding: 10, borderRadius: 10 }}>
                        <Text style={{ alignSelf: "flex-start" }}>{`Deliver to: ${i["deliver_to"]["name"]}`}</Text>
                        <Text style={[{ alignSelf: "flex-start", textDecorationLine: "underline" }]}
                            onPress={() => Linking.openURL(`tel:${i["deliver_to"]["phone_number"]}`)}
                        >{`Phone: ${i["deliver_to"]["phone_number"]}`}
                        </Text>
                        <Text style={{ alignSelf: "flex-start" }}>{`SKU ID: ${i["sku_id"]}`}</Text>
                        <Text style={{ alignSelf: "flex-start" }}>{`Package ID: ${i["_id"]}`}</Text>
                        <Image style={{width:"100%",height:undefined,aspectRatio:1}} resizeMode="contain" source={{uri:i["image_url"]}}/>
                    </View>
                )}
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: "absolute", top: 0, left: 10 }}><Text style={{ color: "white", fontFamily: "Poppins-SemiBold", fontSize: 40, textAlign: "left", textAlignVertical: "top" }}>{"<"}</Text></TouchableOpacity>
        </ScrollView>
    );
}

export default PackageScreen;

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
});