import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import { colors } from '../utils/colors';
import { addUser, removeUser } from '../utils/userSlice';
import { removeToken } from '../utils/auth';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
const GENDER_OPTIONS = ['male', 'female', 'other'];

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.user);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [about, setAbout] = useState(user?.about || '');

  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhotoUrl(user.photoUrl || '');
      setAge(user.age ? String(user.age) : '');
      setGender(user.gender || '');
      setAbout(user.about || '');
      setImageError(false);
    }
  }, [user]);

  // If no user: return null
  if (!user) {
    return null;
  }

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'First name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.patch('/profile/edit', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoUrl: photoUrl.trim(),
        age: age ? Number(age) : undefined,
        gender: gender.trim().toLowerCase(),
        about: about.trim(),
      });

      dispatch(addUser(res?.data?.data));
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Save Failed', err?.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await api.post('/auth/logout', {});
            } catch (err) {
              console.error('Error during logout:', err);
            } finally {
              await removeToken();
              dispatch(removeUser());
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const displayAvatar = (!imageError && (photoUrl || user.photoUrl))
    ? (photoUrl || user.photoUrl)
    : DEFAULT_AVATAR;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar Header */}
        <View style={styles.avatarHeader}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.userNameHeader}>
            {`${firstName} ${lastName}`.trim() || 'My Profile'}
          </Text>
          <Text style={styles.userEmailHeader}>{user.emailId || user.email || ''}</Text>
        </View>

        {/* Profile Edit Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Edit Profile Information</Text>

          {/* First Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Last Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Photo URL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Photo URL</Text>
            <TextInput
              style={styles.input}
              value={photoUrl}
              onChangeText={(text) => {
                setPhotoUrl(text);
                setImageError(false);
              }}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 25"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = gender.toLowerCase() === opt;
                return (
                  <Pressable
                    key={opt}
                    style={({ pressed }) => [
                      styles.genderPill,
                      isSelected && styles.genderPillSelected,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setGender(opt)}
                  >
                    <Text
                      style={[
                        styles.genderPillText,
                        isSelected && styles.genderPillTextSelected,
                      ]}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* About */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>About</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={about}
              onChangeText={setAbout}
              placeholder="Tell other developers about yourself, your tech stack, projects..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Save Profile Button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
              saving && styles.disabledButton,
            ]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
            loggingOut && styles.disabledButton,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userNameHeader: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  userEmailHeader: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multilineInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderPill: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderPillText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  genderPillTextSelected: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ProfileScreen;
