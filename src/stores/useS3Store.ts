import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { S3Config, S3Object, BucketInfo } from "../types/s3";
import { S3Service } from "../services/s3Service";

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
  loading: boolean;
  error: string | null;
  isLoadingBuckets: boolean;
  isLoadingObjects: boolean;
  setLoadingBuckets: (loading: boolean) => void;
  setLoadingObjects: (loading: boolean) => void;

  // Actions
  testConnection: (config: S3Config) => Promise<void>;
  fetchBuckets: () => Promise<void>;
  fetchObjects: () => Promise<void>;
  deleteObjects: (objectKeys: string[]) => Promise<void>;

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
      clearConfig: () =>
        set({
          config: null,
          isConnected: false,
          buckets: [],
          objects: [],
          selectedBucket: null,
          selectedObjects: [],
          currentPrefix: "",
        }),

      // Connection status
      isConnected: false,
      connectionError: null,
      setConnectionStatus: (connected, error) =>
        set({
          isConnected: connected,
          connectionError: error || null,
        }),

      // Buckets
      buckets: [],
      selectedBucket: null,
      setBuckets: (buckets) => set({ buckets }),
      selectBucket: (bucketName) =>
        set({
          selectedBucket: bucketName,
          objects: [],
          selectedObjects: [],
          currentPrefix: "",
        }),

      // Objects
      objects: [],
      selectedObjects: [],
      currentPrefix: "",
      setObjects: (objects) => set({ objects }),
      setSelectedObjects: (objectKeys) => set({ selectedObjects: objectKeys }),
      toggleObjectSelection: (objectKey) => {
        const { selectedObjects } = get();
        const newSelection = selectedObjects.includes(objectKey)
          ? selectedObjects.filter((key) => key !== objectKey)
          : [...selectedObjects, objectKey];
        set({ selectedObjects: newSelection });
      },
      setCurrentPrefix: (prefix) => set({ currentPrefix: prefix }),

      // Loading states
      loading: false,
      error: null,
      isLoadingBuckets: false,
      isLoadingObjects: false,
      setLoadingBuckets: (loading) => set({ isLoadingBuckets: loading }),
      setLoadingObjects: (loading) => set({ isLoadingObjects: loading }),

      // Actions
      testConnection: async (config) => {
        try {
          console.log("🔌 开始测试 OSS 连接");
          const startTime = performance.now();
          set({ loading: true, error: null });

          const result = await S3Service.testConnection(config);

          const endTime = performance.now();
          console.log(
            `✅ OSS 连接测试成功，耗时: ${(endTime - startTime).toFixed(0)}ms`
          );

          set({ isConnected: true, connectionError: null });
          return result;
        } catch (error) {
          console.error("❌ OSS 连接测试失败:", error);
          const errorMessage =
            error instanceof Error ? error.message : "连接失败";
          set({
            isConnected: false,
            connectionError: errorMessage,
            error: errorMessage,
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      fetchBuckets: async () => {
        const { config, isLoadingBuckets } = get();
        if (!config) {
          throw new Error("请先配置 OSS 连接");
        }

        // 避免重复请求
        if (isLoadingBuckets) {
          console.log("⏳ 跳过重复的 fetchBuckets 请求");
          return;
        }

        try {
          console.log("🚀 开始获取 Bucket 列表");
          const startTime = performance.now();
          set({ isLoadingBuckets: true, error: null });

          const buckets = await S3Service.listBuckets(config);

          const endTime = performance.now();
          console.log(
            `✅ Bucket 列表获取成功，耗时: ${(endTime - startTime).toFixed(
              0
            )}ms`
          );

          set({ buckets });
        } catch (error) {
          console.error("❌ 获取 Bucket 列表失败:", error);
          const errorMessage =
            error instanceof Error ? error.message : "获取 Bucket 列表失败";
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoadingBuckets: false });
        }
      },

      fetchObjects: async () => {
        const { config, selectedBucket, currentPrefix, isLoadingObjects } =
          get();
        if (!config || !selectedBucket) {
          throw new Error("请先选择 Bucket");
        }

        // 避免重复请求
        if (isLoadingObjects) {
          console.log("⏳ 跳过重复的 fetchObjects 请求");
          return;
        }

        try {
          console.log(
            `🚀 开始获取文件列表 - Bucket: ${selectedBucket}, Prefix: ${
              currentPrefix || "根目录"
            }`
          );
          const startTime = performance.now();
          set({ isLoadingObjects: true, error: null });

          const objects = await S3Service.listObjects(
            config,
            selectedBucket,
            currentPrefix || undefined
          );

          const endTime = performance.now();
          console.log(
            `✅ 文件列表获取成功，共 ${objects.length} 个文件，耗时: ${(
              endTime - startTime
            ).toFixed(0)}ms`
          );

          set({ objects });
        } catch (error) {
          console.error("❌ 获取文件列表失败:", error);
          const errorMessage =
            error instanceof Error ? error.message : "获取文件列表失败";
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoadingObjects: false });
        }
      },

      deleteObjects: async (objectKeys) => {
        const { config, selectedBucket } = get();
        if (!config || !selectedBucket) {
          throw new Error("请先选择 Bucket");
        }

        try {
          set({ loading: true, error: null });
          await S3Service.deleteObjects(config, selectedBucket, objectKeys);

          // 重新获取对象列表
          const { fetchObjects } = get();
          await fetchObjects();

          // 清空选择
          set({ selectedObjects: [] });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "删除文件失败";
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // UI state
      showConfigModal: false,
      showImagePreview: false,
      previewImageUrl: null,
      currentPreviewObject: null,
      setShowConfigModal: (show) => set({ showConfigModal: show }),
      setShowImagePreview: (show, url, object) =>
        set({
          showImagePreview: show,
          previewImageUrl: url || null,
          currentPreviewObject: object || null,
        }),
    }),
    {
      name: "snowy-oss-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);
