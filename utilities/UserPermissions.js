import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

class UserPermissions {
  getCameraPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status != "granted") {
      alert("Need permission to use your camera roll");
    }
  };
  getMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status != "granted") {
      alert("Need permission to use your media library");
    }
  };
}

export default new UserPermissions();
