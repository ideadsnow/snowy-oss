import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { S3Config, S3Object, BucketInfo } from '../types/s3';

interface S3Store {
  // Configuration
  config: S3Config | null;
  setConfig: (config: S3Config) => void;
  clearConfig: () => void;

  // Connection status
  isConnected: boolean;
  connectionError: string | null;
  setConnectionStatus: (connected: boolean, error?: string) => void;

  // Buckets
  buckets: BucketInfo[];
  selectedBucket: string | null;
  setBuckets: (buckets: BucketInfo[]) => void;
  selectBucket: (bucketName: string) => void;

  // Objects
  objects: S3Object[];
  selectedObjects: string[];
  currentPrefix: string;
  setObjects: (objects: S3Object[]) => void;
  setSelectedObjects: (objectKeys: string[]) => void;
  toggleObjectSelection: (objectKey: string) => void;
  setCurrentPrefix: (prefix: string) => void;

  // Loading states
  isLoadingBuckets: boolean;
  isLoadingObjects: boolean;
  setLoadingBuckets: (loading: boolean) => void;
  setLoadingObjects: (loading: boolean) => void;

  // UI state
  showConfigModal: boolean;
  showImagePreview: boolean;
  previewImageUrl: string | null;
  currentPreviewObject: S3Object | null;
  setShowConfigModal: (show: boolean) => void;
  setShowImagePreview: (show: boolean, url?: string, object?: S3Object) => void;
}

export const useS3Store = create<S3Store>()(
  persist(
    (set, get) => ({
      // Configuration
      config: null,
      setConfig: (config) => set({ config }),
      clearConfig: () => set({ 
        config: null, 
        isConnected: false, 
        buckets: [], 
        objects: [], 
        selectedBucket: null,
        selectedObjects: [],
        currentPrefix: ''
      }),

      // Connection status
      isConnected: false,
      connectionError: null,
      setConnectionStatus: (connected, error) => set({ 
        isConnected: connected, 
        connectionError: error || null 
      }),

      // Buckets
      buckets: [],
      selectedBucket: null,
      setBuckets: (buckets) => set({ buckets }),
      selectBucket: (bucketName) => set({ 
        selectedBucket: bucketName, 
        objects: [], 
        selectedObjects: [],
        currentPrefix: ''
      }),

      // Objects
      objects: [],
      selectedObjects: [],
      currentPrefix: '',
      setObjects: (objects) => set({ objects }),
      setSelectedObjects: (objectKeys) => set({ selectedObjects: objectKeys }),
      toggleObjectSelection: (objectKey) => {
        const { selectedObjects } = get();
        const newSelection = selectedObjects.includes(objectKey)
          ? selectedObjects.filter(key => key !== objectKey)
          : [...selectedObjects, objectKey];
        set({ selectedObjects: newSelection });
      },
      setCurrentPrefix: (prefix) => set({ currentPrefix: prefix }),

      // Loading states
      isLoadingBuckets: false,
      isLoadingObjects: false,
      setLoadingBuckets: (loading) => set({ isLoadingBuckets: loading }),
      setLoadingObjects: (loading) => set({ isLoadingObjects: loading }),

      // UI state
      showConfigModal: false,
      showImagePreview: false,
      previewImageUrl: null,
      currentPreviewObject: null,
      setShowConfigModal: (show) => set({ showConfigModal: show }),
      setShowImagePreview: (show, url, object) => set({ 
        showImagePreview: show, 
        previewImageUrl: url || null,
        currentPreviewObject: object || null
      }),
    }),
    {
      name: 'snowy-oss-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

