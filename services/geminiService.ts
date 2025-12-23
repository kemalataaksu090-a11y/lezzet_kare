
import { GoogleGenAI } from "@google/genai";
import { MenuItem, Order } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-3-flash-preview';

const createSystemInstruction = (menu: MenuItem[]) => `
Sen "LezzetKare" restoranında çalışan çok kibar, bilgili ve yardımsever bir dijital garsonsun.
Türkçe konuşuyorsun.
Aşağıdaki menüdeki yemekler hakkında tam yetkiye ve bilgiye sahipsin.
Müşterilere yemek seçimi konusunda iştah açıcı tavsiyeler ver.
Cevapların kısa, net ve samimi olsun. Asla menüde olmayan bir şeyi önerme.
Müşteri sepetine veya geçmişine göre tamamlayıcı ürünler (içecek, tatlı, yan ürün) öner.

Mevcut Güncel Menü:
${JSON.stringify(menu.map(i => ({ id: i.id, name: i.name, category: i.category, price: i.price, desc: i.description })))}
`;

export const getAIResponse = async (
  userMessage: string, 
  context: { cart: any[], history: Order[], menu: MenuItem[] }
): Promise<string> => {
  try {
    const historySummary = context.history.map(o => o.items.map(i => i.name).join(', ')).join(' | ');
    const cartSummary = context.cart.map(i => `${i.quantity}x ${i.name}`).join(', ');
    
    const fullPrompt = `
    Müşteri Durumu:
    Sepettekiler: ${cartSummary || 'Sepet boş'}
    Geçmiş Siparişler: ${historySummary || 'Henüz sipariş verilmedi'}
    
    Müşteri Sorusu: ${userMessage}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: fullPrompt,
      config: {
        systemInstruction: createSystemInstruction(context.menu),
        temperature: 0.8,
        maxOutputTokens: 300,
      },
    });
    return response.text || "Şu an size cevap veremiyorum ama menümüzdeki tüm yemekler harika!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Küçük bir bağlantı sorunu yaşıyorum. Lütfen menüdeki harika lezzetlerimize göz atmaya devam edin!";
  }
};

export const getProactiveTip = async (cart: any[], history: Order[], menu: MenuItem[]): Promise<string> => {
    try {
        const cartItems = cart.map(i => i.name).join(', ');
        const historyItems = history.map(o => o.items.map(i => i.name).join(', ')).join('; ');
        
        const prompt = `
        Müşterinin sepeti: ${cartItems || 'Boş'}. 
        Masanın geçmişi: ${historyItems || 'Yok'}.
        
        Kısa (max 10 kelime), samimi ve proaktif bir öneride bulun. 
        Emoji kullan. Tamamlayıcı ürünleri (içecek, tatlı) önceliklendir.
        `;
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: createSystemInstruction(menu),
                maxOutputTokens: 60,
                temperature: 0.9
            }
        });
        return response.text?.trim() || "Harika seçim! Yanına buz gibi bir ayran yakışır. 🥛";
    } catch (e) {
        return "Günün özel lezzetini denemek ister misiniz? 🌟";
    }
}

export const summarizeOrderForKitchen = async (orderItems: any[]): Promise<string> => {
    try {
        const itemNames = orderItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
        const prompt = `Aşağıdaki sipariş için mutfağa 5 kelimelik şef notu yaz: ${itemNames}`;
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { maxOutputTokens: 20, temperature: 0.7 }
        });
        return response.text || "";
    } catch (e) { return ""; }
}
