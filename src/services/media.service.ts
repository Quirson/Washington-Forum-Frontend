import { apiClient } from "@/services/api";

// Converte File -> base64 (SEM prefix) e envia para /media/upload/base64
// Retorna media_id (uuid)

const fileToBase64NoPrefix = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.onload = () => {
            const res = reader.result;
            if (typeof res !== "string") return reject(new Error("Invalid file result"));
            // res é data:<mime>;base64,XXXX
            const parts = res.split(",");
            if (parts.length !== 2) return reject(new Error("Invalid base64 data"));
            resolve(parts[1]);
        };
        reader.readAsDataURL(file);
    });
};

export async function uploadFileAsBase64ToMedia(file: File, type: string = "application"): Promise<string> {
    const base64 = await fileToBase64NoPrefix(file);
    const res = await apiClient.post("/media/upload/base64", {
        image: base64,
        type,
    });

    // teu backend agora retorna { id, url, filename, ... }
    const id = res?.id;
    if (!id) throw new Error("Upload did not return media id");
    return id as string;
}
export const mediaService = {
    async uploadBase64(dataUrl: string, type = 'home') {
        return apiClient.post('/media/upload/base64', {
            image: dataUrl,
            type
        });
    }
};