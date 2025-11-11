
import { GoogleGenAI } from "@google/genai";
import type { Car } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder check. In a real environment, the key would be set.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateCarDescription = async (car: Car): Promise<string> => {
  try {
    // FIX: The prompt was using properties (make, year, mileage) that do not exist on the Car type.
    // Updated the prompt to use available properties like dealerName, allocationDate (for year), and carType.
    // Also adjusted the prompt to be for a "new car" to match the data model, which lacks mileage.
    const prompt = `สร้างคำอธิบายการขายที่น่าสนใจสำหรับรถยนต์ใหม่ โดยใช้ข้อมูลต่อไปนี้:
- ตัวแทนจำหน่าย: ${car.dealerName}
- รุ่น: ${car.model}
- ปี: ${new Date(car.allocationDate).getFullYear()}
- สี: ${car.color}
- ประเภทรถ: ${car.carType}
- ราคา: ${Number(car.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท

เน้นจุดเด่นของรถรุ่นนี้, และความคุ้มค่า ให้เหมาะกับการโพสต์ขายออนไลน์ในประเทศไทย เขียนเป็นภาษาไทยที่สั้นกระชับและดึงดูดลูกค้า`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating car description:", error);
    return "เกิดข้อผิดพลาดในการสร้างคำอธิบายด้วย AI";
  }
};