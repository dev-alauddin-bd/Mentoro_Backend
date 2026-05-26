import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dijpmh02w",
  api_key: process.env.CLOUDINARY_API_KEY || "895423858638146",
  api_secret: process.env.CLOUDINARY_API_SECRET || "n-M3D3gV9Vb3hY3rJz1D_9r4X6s"
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mentoro_courses",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  } as unknown as Record<string, unknown>
});

export const upload = multer({ storage: storage });
export { cloudinary };
