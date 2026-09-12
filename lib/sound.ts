let audioCtx: AudioContext | null = null;

export function unlockAudio() {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playOrderChime() {
  if (typeof window === 'undefined') return;
  try {
    unlockAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15); // A6
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

/**
 * 播报订单详情语音（中文合成语音，店员提醒）
 */
export function speakOrderAnnouncement(order: {
  order_no: string;
  order_type: string;
  total_price: number;
  delivery_contact: string;
  delivery_address?: string;
  items?: Array<{ name: string; quantity: number }>;
}) {
  if (typeof window === 'undefined') return;
  try {
    // 1. 先播放双音频清脆提示音
    playOrderChime();

    // 2. 检查浏览器是否支持语音合成
    if (!('speechSynthesis' in window)) {
      console.warn('当前浏览器不支持语音合成 API');
      return;
    }

    // 停止正在播放的语音，防止排队重叠
    window.speechSynthesis.cancel();

    // 提取商品简述（最多列举前2项）
    const itemDetails = (order.items || [])
      .slice(0, 2)
      .map((i) => `${i.name} ${i.quantity}台`)
      .join('，');
    const extraCount = (order.items || []).length > 2 ? `等共${order.items?.length}件家电` : '';

    const amount = Math.round(Number(order.total_price) || 0);
    const speechText = `叮咚！您有新的${order.order_type}订单！金额${amount}元，客户${order.delivery_contact || '顾客'}，所购：${itemDetails}${extraCount}，请及时处理！`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05; // 语速适中微快，清晰明快
    utterance.pitch = 1.0;

    // 优先选择中文本地音色
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.includes('zh') || v.lang.includes('cmn') || v.name.includes('Chinese') || v.name.includes('中文')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('语音播报订单失败:', err);
  }
}

/**
 * 测试语音合成播报
 */
export function testVoiceAnnouncement(customText?: string) {
  if (typeof window === 'undefined') return;
  try {
    playOrderChime();
    if (!('speechSynthesis' in window)) {
      alert('抱歉，您的浏览器暂不支持语音合成，已播放提示音测试');
      return;
    }
    window.speechSynthesis.cancel();
    const text = customText || '语音提醒测试成功！实体门店后台已就绪，随时播报新订单！';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.includes('zh') || v.lang.includes('cmn') || v.name.includes('Chinese') || v.name.includes('中文')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('测试语音失败:', err);
  }
}

