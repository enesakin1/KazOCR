import * as ImagePicker from "expo-image-picker";

class UserPermissions {
  getCameraPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status != "granted") {
      alert("Need permission to use your camera roll");
    }
  };
}

export default new UserPermissions();
