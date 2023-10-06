import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import baseURL from './baseURL';
import * as Keychain from "react-native-keychain";

function LoginScreen({ navigation }) {
    // States for login credential and loading period
    const [username, setusername] = useState("")
    const [password, setpassword] = useState("")
    const [isLoading, setisLoading] = useState(false)

    // Returns JS Promise of call to rider Authenticator API
    function signIn(params) {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({
            "email": params.username,
            "password": params.password,
        });

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        return fetch(`${baseURL}/v1/auth/rider`, requestOptions)
    }

    // Run on page load to check if user already logged in
    // No need to login again if credentials not found
    useEffect(() => {
        Keychain.getGenericPassword().then(result => {
            console.log("stored creds: ", result)
            if (result) {
                signIn({ username: result.username, password: result.password })
                    .then(response => response.json())
                    .then(result => {
                        if (result["code"]) {
                            alert(result["message"])
                        }
                        else {
                            console.log("logged in")
                            navigation.navigate('Rider Home', { riderDetails: result["rider"] });
                        }
                        setisLoading(false)
                    })
                    .catch(error => {
                        setisLoading(false);
                        console.log('error - Could not reach Login API\nTry Again Later', error)
                        alert("Error\n\nCannot Access Login Server\nPossible Fix: Use VPN", JSON.stringify(error));
                    });
            }
        })
    }, [])

    return (
        <ScrollView style={{ backgroundColor: "white" }}>
            <View style={[styles.initScreen]}>
                <Image style={styles.logoStyle} source={require("./Images/GrowSimpleeLogo2.png")} />

                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23']} style={styles.companyNameContainer}>
                    <Text style={[styles.companyName]}>Grow Simplee Agent</Text>
                </LinearGradient>
                <TextInput style={styles.credentialStyle} placeholder=' Username'
                    onChangeText={newText => setusername(newText)}
                    defaultValue=""
                />
                <TextInput style={styles.credentialStyle} placeholder=' Password' secureTextEntry={true}
                    onChangeText={newText => setpassword(newText)}
                    defaultValue=""
                />
                <TouchableOpacity style={[styles.signinButtonContainer]}
                    onPress={() => {
                        //  Login using authenticator API and entered credentials
                        setisLoading(true);
                        signIn({ username: username, password: password })
                            .then(response => response.json())
                            .then(result => {
                                if (result["code"]) {
                                    alert(result["message"])
                                }
                                else {
                                    console.log("logged in")
                                    Keychain.setGenericPassword(username, password).then(res => {
                                        navigation.navigate('Rider Home', { riderDetails: result["rider"] });
                                    });
                                    navigation.navigate('Rider Home', { riderDetails: result["rider"] });
                                }
                                setisLoading(false)
                            })
                            .catch(error => {
                                alert('error - Could not reach Login API\nTry Again Later')
                                setisLoading(false);
                            });
                    }}>
                    <LinearGradient style={[styles.signinButtonContainer, { width: "100%" }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={['#0EBC93', '#0D0E23', '#0D0E23', '#0EBC93']}>
                        <Text disabled={isLoading} style={styles.signinText}>{isLoading ? "Logging in..." : "Sign In"}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

export default LoginScreen;

const styles = StyleSheet.create({
    initScreen: {
        display: "flex",
        alignItems: "center",
        position: "relative",
        background: "#FFFFFF",
        flexDirection: "column",
        height: Dimensions.get('window').height
    },
    logoStyle: {
        padding: "10%",
        margin: 10,
        marginTop: 50
    },
    companyName: {
        color: "white",
        fontFamily: 'Poppins-SemiBold',
        fontSize: 25,
        lineHeight: 40,
        textAlign: "center"
    },
    companyNameContainer: {
        marginVertical: 20,
        width: "80%",
        paddingVertical: 10,
        borderRadius: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    credentialStyle: {
        borderWidth: 1,
        borderColor: "black",
        fontFamily: 'Poppins-Regular',
        width: "80%",
        borderRadius: 12,
        marginVertical: 5,
        shadowColor: "black",
        alignItems: "center",
        padding: 10,
        color: '#000000'
    },
    signinButtonContainer: {
        borderRadius: 100,
        width: "80%",
        height: 51,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 20
    },
    signinText: {
        textAlign: 'center',
        color: "white",
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
        width: "100%",
    }
});