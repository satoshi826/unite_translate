
type Subtitle = {
  index: string;
  timestamp: string;
  text: string;
};

export const handleTranslate = async ({apiKey, promptText, text, onLoading, onFinish}:
  {apiKey: string, promptText: string, text: string, onLoading: (flag: boolean) => void, onFinish: (text: string) => void}) => {
  if (!apiKey || !text) {
      alert("APIキーとテキストを入力してください");
      return;
  }
  try {
    onLoading(true)
    const subtitles = parseSrtString(text);
    const texts = subtitles.map(({text}, i) => ({id: i, text: `<_text___${text}___text_>`}));
    const newSubtitleText = await translate({texts, apiKey, promptText})
    console.log(newSubtitleText);
    const newSubtitles = subtitles.map((subtitle, i) => ({
      ...subtitle,
      text: newSubtitleText[i].text
    }))
    const newSrtContent = createNewSrtString(newSubtitles)
    onFinish(newSrtContent)
  } catch(error) {
    console.error("Translation failed:", error);
    alert("翻訳に失敗しました");
  } finally {
    onLoading(false)
  }
};

const parseSrtString = (srtText: string): Subtitle[] => {
  const srtLines = srtText.split('\n');
  const subtitles: Subtitle[] = [];
  let currentSubtitle: Partial<Subtitle> = {};

  // タイムスタンプの正規表現 (例: "00:04:19,350 --> 00:04:22,933")
  const timestampRegex = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/;
  srtLines.forEach((line) => {
    line = line.trim();
    if (!line) {
      // 空行が来たら、現在の字幕を保存
      if (currentSubtitle.text) {
        subtitles.push(currentSubtitle as Subtitle);
        currentSubtitle = {};
      }
      return;
    }
    if (!currentSubtitle.index && !isNaN(Number(line))) {
      // インデックス行の処理
      currentSubtitle.index = line;
    } else if (timestampRegex.test(line)) {
      // タイムスタンプ行の処理
      currentSubtitle.timestamp = line;
    } else {
      // テキスト行の処理
      currentSubtitle.text = (currentSubtitle.text || '') + (currentSubtitle.text ? '\n' : '') + line;
    }
  });
  // 最後の字幕がまだ保存されていない場合、保存する
  if (currentSubtitle.text) {
    subtitles.push(currentSubtitle as Subtitle);
  }

  return subtitles;
};

type Text = {id: number, text: string}
const translate = async ({ texts, apiKey, promptText }: { texts: Text[], promptText:string,  apiKey: string }) => {
  const promptString = `
  ${promptText}
  結果は次のJSONで回答してください。
  ---
  {result: [
    {"id": 1, "text": "<_text___(result)___text_>"},
    {"id": 2, "text": "<_text___(result)___text_>"},
    ...
    {"id": 100, "text": "<_text___(result)___text_>"},
  ]}
  ---
  `;
  console.log(promptString);
  const translatedTexts: Text[] = [];
  const batchSize = 100; // 1回のリクエストで翻訳するテキストの数

  // textsをbatchSizeごとに分割する関数
  const splitIntoBatches = (arr: Text[], size: number) => {

    const batches: Text[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      batches.push(arr.slice(i, i + size));
    }
    return batches;
  };

  // textsをバッチに分割
  const batches = splitIntoBatches(texts, batchSize);
  console.log(batches)

  for (const batch of batches) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: promptString },
          { role: "user", content: JSON.stringify(batch) },
        ],
      }),
    });
    const res = await response.json();
    const translatedBatch = JSON.parse(res.choices[0].message.content)
    console.log(translatedBatch.result)
    translatedTexts.push(...translatedBatch.result); // 翻訳結果を追加
  }
  return translatedTexts; // 全ての翻訳結果を返す
};

const createNewSrtString = (subtitles: Subtitle[]): string => {
  const srtLines: string[] = [];

  subtitles.forEach((subtitle) => {
    srtLines.push(subtitle.index!);
    srtLines.push(subtitle.timestamp!);
    srtLines.push(subtitle.text!.replace(/_text_/g, '').replace(/[_|<>]/g, '')) // 変換されたテキスト
    srtLines.push(''); // 空行
  });

  return srtLines.join('\n'); // 改行で結合
};