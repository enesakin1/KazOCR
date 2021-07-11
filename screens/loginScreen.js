import { Formik } from "formik";
import * as Yup from "yup";
import React, { Fragment } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  SafeAreaView,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Button, Input } from "react-native-elements";
import { withFirebaseHOC } from "../config";
import { StatusBar } from "expo-status-bar";

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .label("Email")
    .email("Enter a valid email")
    .required("Please enter a registered email"),
  password: Yup.string()
    .label("Password")
    .required()
    .min(6, "Password must have at least 6 characters "),
});
const { width, height } = Dimensions.get("window");
class loginScreen extends React.Component {
  state = {
    passwordVisibility: true,
    rightIcon: "ios-eye",
  };

  goToSignup = () => this.props.navigation.navigate("Signup");

  handlePasswordVisibility = () => {
    this.setState((prevState) => ({
      rightIcon: prevState.rightIcon === "ios-eye" ? "ios-eye-off" : "ios-eye",
      passwordVisibility: !prevState.passwordVisibility,
    }));
  };
  handleOnLogin = async (values, actions) => {
    const { email, password } = values;
    const response = await this.props.firebase.loginWithEmail(email, password);

    if (response.user) {
      this.props.navigation.navigate("App");
    } else {
      actions.setSubmitting(false);
      alert("Seems like there is no account like that. Try something else.");
    }
  };
  render() {
    const { passwordVisibility, rightIcon } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("../assets/poster.png")}
          style={styles.backgroundImage}
        >
          <Formik
            initialValues={{ email: "", password: "", username: "" }}
            onSubmit={(values, actions) => {
              this.handleOnLogin(values, actions);
            }}
            validationSchema={validationSchema}
          >
            {({
              handleChange,
              values,
              handleSubmit,
              errors,
              isValid,
              touched,
              handleBlur,
              isSubmitting,
            }) => (
              <Fragment>
                <View style={styles.textView}>
                  <Input
                    name="email"
                    errorMessage={touched.email && errors.email}
                    style={styles.textInput}
                    value={values.email}
                    placeholderTextColor="#565757"
                    onChangeText={handleChange("email")}
                    autoCapitalize="none"
                    placeholder="E-mail"
                    leftIcon={
                      <Ionicons name="ios-mail" size={24} color="orange" />
                    }
                    onBlur={handleBlur("email")}
                  />
                  <Input
                    name="password"
                    errorMessage={touched.password && errors.password}
                    style={styles.textInput}
                    value={values.password}
                    placeholderTextColor="#565757"
                    onChangeText={handleChange("password")}
                    placeholder="Password"
                    secureTextEntry={passwordVisibility}
                    autoCapitalize="none"
                    onBlur={handleBlur("password")}
                    leftIcon={
                      <Ionicons
                        name="ios-lock-closed"
                        size={24}
                        color="orange"
                      />
                    }
                    rightIcon={
                      <TouchableOpacity onPress={this.handlePasswordVisibility}>
                        <Ionicons name={rightIcon} size={28} color="orange" />
                      </TouchableOpacity>
                    }
                  />
                  <View style={styles.buttonContainer}>
                    <Button
                      buttonType="outline"
                      buttonStyle={{
                        backgroundColor: "orange",
                        borderRadius: 10,
                      }}
                      onPress={handleSubmit}
                      title="Login"
                      disabled={!isValid || isSubmitting}
                      loading={isSubmitting}
                    />
                    <Button
                      title={"Don't have an account? \nSign Up"}
                      onPress={this.goToSignup}
                      titleStyle={{
                        color: "#F57C00",
                      }}
                      type="clear"
                    />
                  </View>
                </View>
              </Fragment>
            )}
          </Formik>
        </ImageBackground>
        <StatusBar hidden={true} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    margin: 8,
  },
  textInput: {
    fontSize: 16,
  },
  textView: {
    flex: 0.43,
    marginLeft: "16%",
    marginRight: "16%",
    justifyContent: "center",
    backgroundColor: "rgba(114, 176, 187, 0.23)",
    borderRadius: 25,
  },
  backgroundImage: {
    width: width,
    height: height,
    justifyContent: "center",
  },
  icons: {
    paddingLeft: 100,
  },
});

export default withFirebaseHOC(loginScreen);
