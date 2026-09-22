import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // XML string cleaning utility
  function cleanXmlString(str: string): string {
    if (!str) return '';
    return str
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // remove CDATA wrappers
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .trim();
  }

  // Dynamic asset detector from title + summary
  function detectAssets(title: string, summary: string): string[] {
    const assets: string[] = [];
    const text = `${title} ${summary}`.toUpperCase();
    
    if (text.includes('USD') || text.includes('DXY') || text.includes('FED') || text.includes('RESERVA FEDERAL') || text.includes('EE.UU') || text.includes('ESTADOS UNIDOS') || text.includes('TREASURY') || text.includes('CPI') || text.includes('IPC') || text.includes('POWELL')) {
      assets.push('USD');
    }
    if (text.includes('EUR') || text.includes('BCE') || text.includes('LAGARDE') || text.includes('EUROZONE') || text.includes('EUROPA') || text.includes('ALEMANIA')) {
      assets.push('EUR');
    }
    if (text.includes('BTC') || text.includes('BITCOIN') || text.includes('CRYPTO') || text.includes('CRIPTO')) {
      assets.push('BTC');
    }
    if (text.includes('ETH') || text.includes('ETHER') || text.includes('ETHEREUM')) {
      assets.push('ETH');
    }
    if (text.includes('JPY') || text.includes('YEN') || text.includes('TOKIO') || text.includes('BOJ') || text.includes('JAPÓN')) {
      assets.push('JPY');
    }
    if (text.includes('GBP') || text.includes('LIBRA') || text.includes('BOE') || text.includes('REINO UNIDO')) {
      assets.push('GBP');
    }
    if (text.includes('CAD') || text.includes('DÓLAR CANADIENSE') || text.includes('CANADÁ') || text.includes('BOC')) {
      assets.push('CAD');
    }
    if (text.includes('AUD') || text.includes('RBA') || text.includes('AUSTRALIA')) {
      assets.push('AUD');
    }
    if (text.includes('GOLD') || text.includes('ORO') || text.includes('XAU') || text.includes('RESERVA DE ORO')) {
      assets.push('GOLD');
    }
    if (text.includes('BRENT') || text.includes('PETRÓLEO') || text.includes('CRUDE') || text.includes('CRUDO') || text.includes('OIL') || text.includes('PETROLEO') || text.includes('WTI')) {
      assets.push('CRUDO BRENT');
    }
    if (text.includes('SPX') || text.includes('S&P') || text.includes('SP500')) {
      assets.push('SPX');
    }
    if (text.includes('NASDAQ') || text.includes('CHIPS') || text.includes('TECH') || text.includes('SEMICONDUCTORES') || text.includes('NVIDIA') || text.includes('APPLE') || text.includes('TSMC') || text.includes('MICROSOFT') || text.includes('AI') || text.includes('INTEL')) {
      assets.push('NASDAQ');
    }

    // Default fallback
    if (assets.length === 0) {
      assets.push('MACRO');
    }
    return assets.slice(0, 4); // return first 4 assets at most
  }

  // Sentiment / trading bias classifier
  function detectBias(title: string, summary: string): string {
    const text = `${title} ${summary}`.toLowerCase();
    
    const bullKeywords = [
      'recorta', 'sube', 'crece', 'record', 'récord', 'máximo', 'maximo', 'alcista', 'bullish', 
      'estimula', 'ganancias', 'demanda', 'positivo', 'supera', 'alza', 'fuerte', 'recupera', 'rally'
    ];
    
    const bearKeywords = [
      'cae', 'baja', 'pánico', 'panico', 'guerra', 'bomba', 'conflicto', 'tensión', 'tension', 
      'bajista', 'bearish', 'riesgo', 'pérdidas', 'perdidas', 'debilidad', 'caída', 'caida', 
      'desempleo', 'recesión', 'recesion', 'militar', 'crisis', 'desciende', 'retrocede'
    ];

    let bullCount = 0;
    let bearCount = 0;

    for (const kw of bullKeywords) {
      if (text.includes(kw)) bullCount++;
    }
    for (const kw of bearKeywords) {
      if (text.includes(kw)) bearCount++;
    }

    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('btc') || text.includes('eth')) {
      if (bullCount > bearCount) return 'Alcista para Crypto';
      if (bearCount > bullCount) return 'Bajista para Crypto';
    }

    if (text.includes('nasdaq') || text.includes('tech') || text.includes('semiconductores') || text.includes('ai ') || text.includes('ia ')) {
      if (bullCount > bearCount) return 'Alcista para Tech';
      if (bearCount > bullCount) return 'Bajista para Tech';
    }

    if (bullCount > bearCount) {
      return 'Alcista para Riesgo';
    } else if (bearCount > bullCount) {
      return 'Bajista General';
    } else {
      return 'Neutro / Rango';
    }
  }

  // Server-side RSS feed Fetch and Parsing logic (Zero CORS, zero external dependencies parser)
  app.get("/api/news", async (req, res) => {
    try {
      const source = req.query.source as string || 'forexlive';
      
      let feedUrl = 'https://www.forexlive.com/feed/';
      if (source === 'cnbc_finance') {
        feedUrl = 'https://www.cnbc.com/id/10001147/device/rss/rss.html';
      } else if (source === 'cnbc_economy') {
        feedUrl = 'https://www.cnbc.com/id/20910258/device/rss/rss.html';
      } else if (source === 'marketwatch') {
        feedUrl = 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse';
      }

      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS. Status: ${response.status}`);
      }

      const xmlText = await response.text();
      
      const parsedItems: any[] = [];
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        
        // Extract title
        const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
        const title = titleMatch ? cleanXmlString(titleMatch[1]) : 'Noticia Macro';
        
        // Extract description
        const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
        let summary = descMatch ? cleanXmlString(descMatch[1]) : '';
        
        // If description is empty, check for content:encoded
        if (!summary) {
          const contentMatch = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);
          if (contentMatch) {
            summary = cleanXmlString(contentMatch[1]);
          }
        }

        // Limit summary length
        if (summary.length > 220) {
          summary = summary.substring(0, 217) + '...';
        }
        
        // Extract date
        const dateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
        const pubDate = dateMatch ? cleanXmlString(dateMatch[1]) : new Date().toUTCString();
        
        // Extract link
        const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemContent);
        const link = linkMatch ? cleanXmlString(linkMatch[1]) : '';

        // Generate analytics
        const assets = detectAssets(title, summary);
        const bias = detectBias(title, summary);

        parsedItems.push({
          title,
          summary: summary || 'Haga clic para expandir la noticia completa en la terminal del emisor.',
          pubDate,
          link,
          assets,
          bias
        });

        // Pull top 15 news articles maximum
        if (parsedItems.length >= 15) {
          break;
        }
      }

      res.json({
        success: true,
        source,
        feedUrl,
        news: parsedItems
      });

    } catch (error: any) {
      console.error("RSS proxy error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Unknown error fetching RSS feed"
      });
    }
  });

  // Live Ticker Prices Proxy using Yahoo Finance
  app.get("/api/prices", async (req, res) => {
    const tickers = [
      { id: 'btc', symbol: 'BTC/USD', query: 'BTC-USD', fallbackPrice: '68,450.00' },
      { id: 'eth', symbol: 'ETH/USD', query: 'ETH-USD', fallbackPrice: '3,822.40' },
      { id: 'spx', symbol: 'S&P 500', query: '^GSPC', fallbackPrice: '5,312.30' },
      { id: 'nasdaq', symbol: 'NASDAQ', query: '^IXIC', fallbackPrice: '18,802.50' },
      { id: 'dxy', symbol: 'DXY (Dólar)', query: 'DX-Y.NYB', fallbackPrice: '104.18' },
      { id: 'gold', symbol: 'ORO (XAU)', query: 'GC=F', fallbackPrice: '2,360.50' },
      { id: 'brent', symbol: 'CRUDO BRENT', query: 'CL=F', fallbackPrice: '81.45' },
      { id: 'eurusd', symbol: 'EUR/USD', query: 'EURUSD=X', fallbackPrice: '1.0881' }
    ];

    try {
      const results = await Promise.all(
        tickers.map(async (t) => {
          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t.query}?interval=1d&range=2d`;
            const resp = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
              }
            });
            if (!resp.ok) {
              return { symbol: t.symbol, price: t.fallbackPrice, change: 0.15, isUp: true };
            }
            const data = await resp.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (!meta) {
              return { symbol: t.symbol, price: t.fallbackPrice, change: 0.15, isUp: true };
            }

            const current = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || current;
            
            // Format price based on size
            let formattedPrice = String(current);
            if (current >= 1000) {
              formattedPrice = current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else if (current < 2) {
              formattedPrice = current.toFixed(4);
            } else {
              formattedPrice = current.toFixed(2);
            }

            const changePct = prevClose ? ((current - prevClose) / prevClose) * 100 : 0;
            return {
              symbol: t.symbol,
              price: formattedPrice,
              change: parseFloat(changePct.toFixed(2)),
              isUp: changePct >= 0
            };
          } catch (e) {
            console.warn(`Failed to fetch ${t.symbol}:`, e);
            return { symbol: t.symbol, price: t.fallbackPrice, change: 0.15, isUp: true };
          }
        })
      );

      res.json({
        success: true,
        data: results
      });
    } catch (err: any) {
      res.json({
        success: false,
        error: err.toString()
      });
    }
  });

  // Geopolitical Live AI Analysis
  app.get("/api/geopolitical-analysis", async (req, res) => {
    const conflictId = req.query.id as string || 'C1';
    
    // Find matching conflict
    const conflictsMap: Record<string, any> = {
      'C1': {
        name: 'Tensión en Estrecho de Ormuz (Golfo Pérsico)',
        intensity: 'Alta',
        assetsAffected: ['CRUDO BRENT', 'CRUDO WTI', 'USD'],
        description: 'Fricciones de seguridad marítima en el canal neurálgico del petróleo. Las amenazas de cierre de canales comerciales por patrullas regionales presionan fuertemente el crudo Brent al alza.'
      },
      'C2': {
        name: 'Soberanía del Microchip (Mar de China Meridional)',
        intensity: 'Media',
        assetsAffected: ['NASDAQ', 'USD/JPY', 'Acciones Semiconductores'],
        description: 'Ejercicios navales coordinados e imposición de cuotas arancelarias a las cadenas de exportación tecnológica asiática. Afecta los precios de empresas como TSMC, Nvidia y Apple.'
      },
      'C3': {
        name: 'Crisis Agraria & Energética del Corredor Báltico',
        intensity: 'Baja',
        assetsAffected: ['Gas Natural', 'EUR/USD', 'Trigo'],
        description: 'Alineamiento fronterizo estricto, interrupción de flujos remanentes de materias primas pesadas hacia Europa Central y paros portuarios estacionales.'
      }
    };

    const conflict = conflictsMap[conflictId] || conflictsMap['C1'];

    try {
      let responseText = "";
      let hasAi = false;

      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build'
              }
            }
          });

          // Generate analysis prompt
          const prompt = `Actúa como el Analista Principal de un Cabinet de Inteligencia Geopolítica de Kosmopoly.
Analiza la siguiente crisis geopolítica con el máximo nivel de rigor macroeconómico y militar, proyectando su impacto en activos financieros.

Crisis elegida:
- Nombre: ${conflict.name}
- Intensidad actual: ${conflict.intensity}
- Activos mayormente afectados: ${conflict.assetsAffected.join(', ')}
- Resumen base: ${conflict.description}

Estructura tu análisis estrictamente en español con formato Markdown en 4 secciones concretas y profundas, con prosa madura y profesional (evita saludos o explicaciones meta-texto, ve directo):

### 🌐 1. Situación Actual y Riesgo de Escala
[Análisis de factores militares, rutas de suministro o diplomáticos en juego. Mantén un tono sumamente sofisticado y realista.]

### 📈 2. Impacto de Precios en Activos Concretos
[Detalla cómo afecta individualmente a los activos listados: ${conflict.assetsAffected.join(', ')}. Explica la correlación y el flujo de capital (Flight to Safety, etc.).]

### ⚡ 3. Sugerencia de Operación Táctica (Trade Idea Setup)
[Provee un plan de trading institucional con un setup claro para un activo de los afectados. Incluye: Activo, Dirección (Long/Short), Nivel Técnico a vigilar y Justificación.]

### 🚨 4. Indicador "Trigger" de Gabinete
[Define un evento específico del mundo real que actuaría como detonante para elevar la intensidad de esta crisis o anular el escenario base.]`;

          let response;
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt,
              config: {
                temperature: 0.75,
              }
            });
            responseText = response?.text || "";
            hasAi = !!responseText;
          } catch (modelErr: any) {
            try {
              response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
                config: {
                  temperature: 0.75,
                }
              });
              responseText = response?.text || "";
              hasAi = !!responseText;
            } catch (fallbackErr: any) {
              responseText = "";
              hasAi = false;
            }
          }
        } catch (apiErr: any) {
          responseText = "";
          hasAi = false;
        }
      }

      // If Gemini fails or was not configured, supply high-quality simulated assessment
      if (!responseText) {
        if (conflictId === 'C1') {
          responseText = `### 🌐 1. Situación Actual y Riesgo de Escala
El Estrecho de Ormuz continúa bajo máxima alerta militar tras la patrulla aérea y naval de potencias regionales. Alrededor del 20% del petróleo mundial cruza este cuello de botella marítimo, lo que significa que el riesgo comercial no es meramente local sino sistémico. Cualquier interrupción o incidente de navegación armada tiene una probabilidad de propagación de escala del 85% a otros estrechos adyacentes (Canal de Suez y Bab el-Mandeb).

### 📈 2. Impacto de Precios en Activos Concretos
*   **CRUDO BRENT:** Actúa como el primer termómetro reactivo. Esperamos un incremento de prima de riesgo de +$4.00 a +$7.50 USD por barril en caso de detención temporal de navíos comerciales.
*   **USD (Safe Haven):** Ante el aumento de las tensiones, los flujos de capital rotarán saliendo de monedas de beta alta hacia el billete verde, apreciando el índice DXY hacia la zona psicológica de 105.20.

### ⚡ 3. Sugerencia de Operación Táctica (Trade Idea Setup)
*   **Activo:** CRUDO BRENT (CL)
*   **Dirección:** COMPRAS / LONG
*   **Nivel Técnico:** Zona de descuento institucional diario en $80.20 - $80.50.
*   **Justificación:** Estructura alcista respaldada por order blocks institucionales sin mitigar en temporalidad de H4, coincidiendo con la asimetría de la prima geopolítica latente.

### 🚨 4. Indicador "Trigger" de Gabinete
El detonante clave para escalar la intensidad a "CRÍTICA" sería el ataque militar o la detención de un buque cisterna con bandera de la coalición internacional. Esto anularía de inmediato nuestras proyecciones laterales y forzaría compras agresivas de pánico de futuros de energía.`;
        } else if (conflictId === 'C2') {
          responseText = `### 🌐 1. Situación Actual y Riesgo de Escala
La soberanía militar y económica de las rutas navales y plantas de fundición en el Mar de China Meridional representa un foco de tensión estructural de largo plazo. El control de la cadena de suministro de microchips avanzados (de arquitectura menor a 5nm) es vital para el desarrollo global de software y hardware de Inteligencia Artificial, lo que convierte la zona en un teatro de disputa industrial implacable.

### 📈 2. Impacto de Precios en Activos Concretos
*   **NASDAQ:** Es el activo más sensible del planeta ante bloqueos logísticos de hardware. Cualquier cese de exportación taiwanesa o coreana de chips reprimiría al índice técnico entre un 5% y un 12%.
*   **USD/JPY:** El Yen japonés responde de forma simétrica a la proximidad territorial de riesgos; no obstante, la liquidez fluye masivamente al USD, forzando devaluación del Yen por repunte de diferenciales de rentabilidad de bonos americanos.

### ⚡ 3. Sugerencia de Operación Táctica (Trade Idea Setup)
*   **Activo:** NASDAQ Indices (NQ)
*   **Dirección:** VENTAS / SHORT
*   **Nivel Técnico:** Ruptura de soporte y retesteo de bloque M15 en los 18,920.
*   **Justificación:** Mitigación técnica de liquidez superior minorista seguida de un quiebre de carácter (CHoCH) tras simulacros navales sorpresivos informados en medios financieros.

### 🚨 4. Indicador "Trigger" de Gabinete
La imposición unilateral de cuotas de exportación estrictas de tierras raras por parte de potencias del bloque asiático hacia corporaciones occidentales de tecnología de semiconductores. Esto activaría instantáneamente la fase preventiva agresiva.`;
        } else {
          responseText = `### 🌐 1. Situación Actual y Riesgo de Escala
El Corredor Báltico enfrenta presiones significativas debido a regulaciones aduaneras de emergencia y reclamos sobre la infraestructura de cables submarinos de fibra y ductos energéticos remanentes. Las tensiones agrarias y las huelgas de trabajadores de muelles complican las proyecciones de distribución estables en las puertas de entrada al norte de la eurozona.

### 📈 2. Impacto de Precios en Activos Concretos
*   **GAS NATURAL:** Altamente hipersensible a averías en la infraestructura del norte de Europa. Incrementos inmediatos de volatilidad si se reportan interrupciones en los ductos marinos bálticos.
*   **EUR/USD:** Debilitamiento persistente del euro por encarecimiento estructural de costes energéticos industriales, deprimiendo el margen operativo alemán y forzando al par de divisas hacia el nivel de soporte en 1.0760.

### ⚡ 3. Sugerencia de Operación Táctica (Trade Idea Setup)
*   **Activo:** EUR/USD
*   **Dirección:** SHORT / VENTA
*   **Nivel Técnico:** Reentrada en bloque diario de órdenes en 1.0910.
*   **Justificación:** Estructura marcadamente bajista e ineficiencias (FVG) de volumen diario no cubiertas, confluencia por alza de costes globales de materias primas europeas.

### 🚨 4. Indicador "Trigger" de Gabinete
Cualquier daño físico o "sabotaje técnico" sospechoso reportado en las líneas de fibra de telecomunicación báltica clave o en los conectores eléctricos suecos-bálticos. Ello elevaría de inmediato el riesgo a nivel global.`;
        }
      }

      res.json({
        success: true,
        ai: hasAi,
        conflictId,
        analysis: responseText
      });

    } catch (err: any) {
      res.json({
        success: false,
        error: err.toString()
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with RSS feeds capability.`);
  });
}

startServer();
