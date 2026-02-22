import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChildProfile } from '@/constants/types';
import {
  getProfiles,
  saveProfile,
  deleteProfile as deleteProfileStorage,
  getActiveProfileId,
  setActiveProfileId,
} from '@/lib/storage';

interface ProfileContextType {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  loading: boolean;
  switchProfile: (id: string | null) => Promise<void>;
  createProfile: (profile: ChildProfile) => Promise<void>;
  updateProfile: (profile: ChildProfile) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profiles: [],
  activeProfile: null,
  loading: true,
  switchProfile: async () => {},
  createProfile: async () => {},
  updateProfile: async () => {},
  removeProfile: async () => {},
  refreshProfiles: async () => {},
});

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    const all = await getProfiles();
    setProfiles(all);
    const activeId = await getActiveProfileId();
    if (activeId) {
      const found = all.find((p) => p.id === activeId);
      setActiveProfile(found || null);
    } else {
      setActiveProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const switchProfile = useCallback(async (id: string | null) => {
    await setActiveProfileId(id);
    if (id) {
      const all = await getProfiles();
      setActiveProfile(all.find((p) => p.id === id) || null);
    } else {
      setActiveProfile(null);
    }
  }, []);

  const createProfile = useCallback(async (profile: ChildProfile) => {
    await saveProfile(profile);
    await setActiveProfileId(profile.id);
    await refreshProfiles();
  }, [refreshProfiles]);

  const updateProfile = useCallback(async (profile: ChildProfile) => {
    await saveProfile(profile);
    await refreshProfiles();
  }, [refreshProfiles]);

  const removeProfile = useCallback(async (id: string) => {
    await deleteProfileStorage(id);
    const activeId = await getActiveProfileId();
    if (activeId === id) {
      await setActiveProfileId(null);
    }
    await refreshProfiles();
  }, [refreshProfiles]);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loading,
        switchProfile,
        createProfile,
        updateProfile,
        removeProfile,
        refreshProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
