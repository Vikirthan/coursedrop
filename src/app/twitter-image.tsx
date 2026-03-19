import OpenGraphImage from "./opengraph-image";

export const runtime = "edge";
export const alt = "CourseDrop — Study Material Portal";
export const contentType = "image/png";
export const size = {
	width: 1200,
	height: 630,
};

export default function TwitterImage() {
	return OpenGraphImage();
}