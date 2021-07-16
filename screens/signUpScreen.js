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
  username: Yup.string()
    .label("Username")
    .required("Please enter an username")
    .min(6, "Username must have at least 6 characters "),
});
const { width, height } = Dimensions.get("window");

class signUpScreen extends React.Component {
  state = {
    passwordVisibility: true,
    rightIcon: "ios-eye",
  };

  goToLogin = () => this.props.navigation.navigate("Login");

  handlePasswordVisibility = () => {
    this.setState((prevState) => ({
      rightIcon: prevState.rightIcon === "ios-eye" ? "ios-eye-off" : "ios-eye",
      passwordVisibility: !prevState.passwordVisibility,
    }));
  };
  handleOnSignup = async (values, actions) => {
    const { username, email, password } = values;

    const response = await this.props.firebase.signupWithEmail(email, password);

    if (response.user.uid) {
      const { uid } = response.user;
      const created = Date.now();
      const userData = {
        email,
        username,
        uid,
        created,
      };
      await this.props.firebase.createNewUser(userData);
      this.props.navigation.navigate("App");
    } else {
      actions.setSubmitting(false);
      alert("You have already signed up with this e-mail");
    }
  };
  render() {
    const { passwordVisibility, rightIcon } = this.state;
    return (
      <ScrollView>
        <KeyboardAvoidingView>
          <SafeAreaView style={styles.container}>
            <ImageBackground
              source={require("../assets/poster.jpg")}
              style={styles.backgroundImage}
            >
              <Formik
                initialValues={{ email: "", password: "", username: "" }}
                onSubmit={(values, actions) => {
                  this.handleOnSignup(values, actions);
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
                        placeholder="Enter email"
                        leftIcon={
                          <Ionicons name="ios-mail" size={24} color="orange" />
                        }
                        onBlur={handleBlur("email")}
                      />
                      <Input
                        name="username"
                        style={styles.textInput}
                        errorMessage={touched.username && errors.username}
                        value={values.username}
                        placeholderTextColor="#565757"
                        onChangeText={handleChange("username")}
                        placeholder="Enter username"
                        autoCapitalize="none"
                        onBlur={handleBlur("username")}
                        leftIcon={
                          <Ionicons
                            name="ios-person"
                            size={24}
                            color="orange"
                          />
                        }
                      />
                      <Input
                        name="password"
                        errorMessage={touched.password && errors.password}
                        style={styles.textInput}
                        value={values.password}
                        placeholderTextColor="#565757"
                        onChangeText={handleChange("password")}
                        placeholder="Enter password"
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
                          <TouchableOpacity
                            onPress={this.handlePasswordVisibility}
                          >
                            <Ionicons
                              name={rightIcon}
                              size={28}
                              color="orange"
                            />
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
                          title="Sign Up"
                          buttonColor="#039BE5"
                          disabled={!isValid || isSubmitting}
                          loading={isSubmitting}
                        />
                        <Button
                          title="Already have an account? Login"
                          onPress={this.goToLogin}
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
          </SafeAreaView>
        </KeyboardAvoidingView>
        <StatusBar hidden={true} />
      </ScrollView>
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
    flex: 0.51,
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

export default withFirebaseHOC(signUpScreen);
