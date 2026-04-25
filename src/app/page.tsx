'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Download,
  Play,
  Pause,
  Volume2,
  Languages,
  Settings,
  Sparkles,
  Globe,
  Shield,
  Zap,
  StopCircle,
  FileAudio,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
type LangToggle = 'ar' | 'en';

const LANGUAGES = [
  { value: 'ar', label: 'العربية', labelEn: 'Arabic' },
  { value: 'en', label: 'الإنجليزية', labelEn: 'English' },
  { value: 'es', label: 'الإسبانية', labelEn: 'Spanish' },
  { value: 'fr', label: 'الفرنسية', labelEn: 'French' },
  { value: 'zh', label: 'الصينية', labelEn: 'Chinese' },
  { value: 'ja', label: 'اليابانية', labelEn: 'Japanese' },
  { value: 'ko', label: 'الكورية', labelEn: 'Korean' },
  { value: 'de', label: 'الألمانية', labelEn: 'German' },
];

const VOICE_STYLES = [
  { value: 'neutral', label: 'محايد', labelEn: 'Neutral' },
  { value: 'happy', label: 'سعيد', labelEn: 'Happy' },
  { value: 'sad', label: 'حزين', labelEn: 'Sad' },
  { value: 'angry', label: 'غاضب', labelEn: 'Angry' },
  { value: 'excited', label: 'متحمس', labelEn: 'Excited' },
];

const STATUS_MESSAGES: Record<ProcessingStatus, { ar: string; en: string }> = {
  idle: { ar: 'جاهز للبدء', en: 'Ready to start' },
  uploading: { ar: 'جارٍ رفع الملف...', en: 'Uploading file...' },
  processing: { ar: 'جارٍ معالجة الصوت...', en: 'Processing audio...' },
  done: { ar: 'تم بنجاح!', en: 'Done!' },
  error: { ar: 'حدث خطأ، حاول مجدداً', en: 'An error occurred, try again' },
};

export default function Home() {
  // State
  const [lang, setLang] = useState<LangToggle>('ar');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('ar');
  const [voiceStyle, setVoiceStyle] = useState('neutral');
  const [speed, setSpeed] = useState([1.0]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [progressValue, setProgressValue] = useState(0);
  const [outputAudioUrl, setOutputAudioUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const outputAudioRef = useRef<HTMLAudioElement | null>(null);

  const t = useCallback(
    (ar: string, en: string) => (lang === 'ar' ? ar : en),
    [lang]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (outputAudioUrl) URL.revokeObjectURL(outputAudioUrl);
    };
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3'))) {
        handleAudioFile(file);
      }
    },
    [lang]
  );

  const handleAudioFile = (file: File) => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setAudioFile(file);
    setAudioFileName(file.name);
    const url = URL.createObjectURL(file);
    setRecordedUrl(url);

    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      const dur = audio.duration;
      const mins = Math.floor(dur / 60);
      const secs = Math.floor(dur % 60);
      setAudioDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAudioFile(file);
  };

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setAudioFileName(t('تسجيل صوتي', 'Voice Recording'));
        setAudioDuration(`0:${recordingTime.toString().padStart(2, '0')}`);

        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      // Microphone access denied
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  // Clone voice API call
  const handleClone = async () => {
    if (!inputText.trim()) return;

    setProcessingStatus('uploading');
    setProgressValue(10);

    try {
      setProcessingStatus('processing');
      setProgressValue(20);

      // Simulate progress during generation
      const progressInterval = setInterval(() => {
        setProgressValue((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 3;
        });
      }, 600);

      // Step 1: Upload reference audio to Python backend (for future OpenVoice integration)
      if (audioFile) {
        const formData = new FormData();
        formData.append('audio_file', audioFile);
        formData.append('text', inputText);
        formData.append('target_language', targetLanguage);
        formData.append('speed', speed[0].toString());
        formData.append('emotion', voiceStyle);

        fetch('/api/clone?XTransformPort=3030', {
          method: 'POST',
          body: formData,
        }).catch(() => {
          // Non-blocking: reference audio saved for future OpenVoice V2 integration
        });
      }

      // Step 2: Generate TTS audio using z-ai-web-dev-sdk
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          language: targetLanguage,
          speed: speed[0],
        }),
      });

      clearInterval(progressInterval);

      if (!ttsResponse.ok) {
        throw new Error('TTS generation failed');
      }

      const data = await ttsResponse.json();

      if (data.audioUrl) {
        setProgressValue(95);
        // Set the audio URL for playback
        const fullUrl = data.audioUrl;
        setOutputAudioUrl(fullUrl);
      }

      setProgressValue(100);
      setProcessingStatus('done');

      setTimeout(() => {
        setProcessingStatus('idle');
        setProgressValue(0);
      }, 3000);
    } catch {
      setProcessingStatus('error');
      setProgressValue(0);
      setTimeout(() => {
        setProcessingStatus('idle');
      }, 3000);
    }
  };

  const handleDownload = () => {
    if (!outputAudioUrl) return;
    const a = document.createElement('a');
    a.href = outputAudioUrl;
    a.download = 'cloned-voice.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!outputAudioUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('صوت مستنسخ', 'Cloned Voice'),
          text: t('استمع إلى صوتي المستنسخ', 'Listen to my cloned voice'),
          url: outputAudioUrl,
        });
      }
    } catch {
      // Share cancelled or not supported
    }
  };

  const togglePlayOutput = () => {
    if (!outputAudioUrl || !outputAudioRef.current) return;
    if (isPlaying) {
      outputAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      outputAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t('استنساخ الصوت', 'Voice Clone')}
              </h1>
              <p className="text-[10px] text-gray-400 -mt-0.5 font-mono">
                Cross-Lingual Voice Cloning
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2"
          >
            <Languages className="w-4 h-4" />
            {lang === 'ar' ? 'English' : 'عربي'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {t('حوّل صوتك إلى أي لغة', 'Transform Your Voice to Any Language')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            {t(
              'ارفع عينة صوتية، أدخل النص، واختر اللغة المستهدفة — واحصل على صوتك يتحدث أي لغة في العالم',
              'Upload a voice sample, enter text, and choose a target language — get your voice speaking any language in the world'
            )}
          </p>

          {/* Wave Visualization */}
          <div className="flex items-center justify-center gap-1 h-16" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-purple-500 to-cyan-500 animate-pulse"
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
                  animationDuration: `${0.8 + Math.random() * 1.2}s`,
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Audio Upload Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-purple-500/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-5 h-5 text-purple-400" />
                  {t('رفع الصوت', 'Upload Audio')}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {t('ارفع ملف صوتي أو سجّل صوتك مباشرة', 'Upload an audio file or record your voice directly')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                    isDragging
                      ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
                      : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/[0.07]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  {recordedUrl ? (
                    <div className="space-y-3">
                      <FileAudio className="w-12 h-12 mx-auto text-cyan-400" />
                      <p className="text-sm text-white font-medium">{audioFileName}</p>
                      {audioDuration && (
                        <Badge variant="secondary" className="bg-white/10 text-gray-300">
                          {audioDuration}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-400">
                        {t('انقر لتغيير الملف', 'Click to change file')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-300">
                        {t(
                          'اسحب الملف هنا أو انقر للاختيار',
                          'Drag file here or click to select'
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        WAV, MP3 — {t('أقل من 30 ثانية', 'less than 30 seconds')}
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="bg-white/10" />

                {/* Record Button */}
                <div className="flex items-center gap-4">
                  {isRecording ? (
                    <Button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-1"
                    >
                      <StopCircle className="w-4 h-4" />
                      {t('إيقاف التسجيل', 'Stop Recording')}
                      <span className="text-red-200 text-xs">
                        0:{recordingTime.toString().padStart(2, '0')}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={startRecording}
                      variant="outline"
                      className="bg-white/5 border-white/20 hover:bg-white/10 text-white gap-2 flex-1"
                    >
                      <Mic className="w-4 h-4" />
                      {t('تسجيل', 'Record')}
                    </Button>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-400 text-sm font-medium">
                        {t('جارٍ التسجيل', 'Recording')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Text Input Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-purple-500/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  {t('النص المراد نطقه', 'Text to Speak')}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {t('أدخل النص الذي تريد أن ينطقه الصوت المستنسخ', 'Enter the text you want the cloned voice to speak')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب النص هنا... مثلاً: مرحباً، كيف حالك اليوم؟'
                      : 'Type text here... e.g.: Hello, how are you today?'
                  }
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-purple-500/50 resize-none"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {inputText.length} {t('حرف', 'characters')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t('الحد الأقصى: 500 حرف', 'Max: 500 characters')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-purple-500/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5 text-violet-400" />
                  {t('الإعدادات', 'Settings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Language */}
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    {t('اللغة المستهدفة', 'Target Language')}
                  </Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value} className="text-white focus:bg-white/10 focus:text-white">
                          {lang === 'ar' ? l.label : l.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Style */}
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    {t('نبرة الصوت', 'Voice Style')}
                  </Label>
                  <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {VOICE_STYLES.map((v) => (
                        <SelectItem key={v.value} value={v.value} className="text-white focus:bg-white/10 focus:text-white">
                          {lang === 'ar' ? v.label : v.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Speed Slider */}
                <div className="space-y-3">
                  <Label className="text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      {t('السرعة', 'Speed')}
                    </span>
                    <Badge variant="secondary" className="bg-white/10 text-gray-300">
                      {speed[0].toFixed(1)}x
                    </Badge>
                  </Label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Clone Button */}
                <Button
                  onClick={handleClone}
                  disabled={!inputText.trim() || processingStatus === 'uploading' || processingStatus === 'processing'}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                >
                  {processingStatus === 'uploading' || processingStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('جارٍ المعالجة...', 'Processing...')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('استنساخ الصوت', 'Clone Voice')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Output Audio Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-cyan-500/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  {t('الصوت المستنسخ', 'Cloned Voice')}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {t('استمع إلى النتيجة وقم بتنزيلها', 'Listen to the result and download it')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {outputAudioUrl ? (
                  <>
                    <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center gap-4">
                      {/* Playback visualization */}
                      <div className="flex items-center justify-center gap-0.5 h-12 w-full max-w-xs" aria-hidden="true">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 to-cyan-400 transition-all duration-300"
                            style={{
                              height: isPlaying
                                ? `${15 + Math.sin(Date.now() / 200 + i * 0.7) * 35 + Math.random() * 15}%`
                                : '20%',
                            }}
                          />
                        ))}
                      </div>

                      <audio
                        ref={outputAudioRef}
                        src={outputAudioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={togglePlayOutput}
                          size="icon"
                          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25"
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white mr-[-2px]" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('تنزيل', 'Download')}
                      </Button>
                      <Button
                        onClick={handleShare}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        {t('مشاركة', 'Share')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/5 rounded-xl p-12 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Volume2 className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {t(
                        'سيظهر الصوت المستنسخ هنا بعد المعالجة',
                        'Cloned voice will appear here after processing'
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Status Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-purple-500/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  {processingStatus === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : processingStatus === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Loader2
                      className={`w-5 h-5 text-purple-400 ${
                        processingStatus === 'uploading' || processingStatus === 'processing'
                          ? 'animate-spin'
                          : ''
                      }`}
                    />
                  )}
                  {t('حالة المعالجة', 'Processing Status')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      processingStatus === 'done'
                        ? 'default'
                        : processingStatus === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className={
                      processingStatus === 'idle'
                        ? 'bg-gray-700 text-gray-300'
                        : processingStatus === 'uploading'
                          ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                          : processingStatus === 'processing'
                            ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                            : processingStatus === 'done'
                              ? 'bg-green-600/20 text-green-400 border-green-500/30'
                              : 'bg-red-600/20 text-red-400 border-red-500/30'
                    }
                  >
                    {STATUS_MESSAGES[processingStatus][lang === 'ar' ? 'ar' : 'en']}
                  </Badge>
                </div>

                {(processingStatus === 'uploading' || processingStatus === 'processing') && (
                  <div className="space-y-2">
                    <Progress
                      value={progressValue}
                      className="h-2 bg-white/10"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      {progressValue}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features Info Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl shadow-purple-500/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  {t('المميزات', 'Features')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Instant Cloning */}
                  <div className="bg-white/5 rounded-xl p-4 text-center space-y-3 hover:bg-white/[0.08] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {t('استنساخ لحظي', 'Instant Cloning')}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {t('عينة قصيرة أقل من 30 ثانية', 'Short sample under 30 seconds')}
                    </p>
                  </div>

                  {/* Granular Control */}
                  <div className="bg-white/5 rounded-xl p-4 text-center space-y-3 hover:bg-white/[0.08] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {t('تحكم دقيق', 'Granular Control')}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {t('التحكم في المشاعر والنبرة', 'Control emotions and tone')}
                    </p>
                  </div>

                  {/* Cross-Lingual */}
                  <div className="bg-white/5 rounded-xl p-4 text-center space-y-3 hover:bg-white/[0.08] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {t('عابر للغات', 'Cross-Lingual')}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {t('انقل صوتك بين اللغات', 'Transfer your voice across languages')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950/80 backdrop-blur-xl border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-2">
          <p className="text-gray-400 text-sm">
            {t('صنع بحب في الامارات 🇦🇪', 'Made with love in the UAE 🇦🇪')}
          </p>
          <p className="text-gray-500 text-xs">
            {t('التطوير والإشراف: @binnoma', 'Development & Supervision: @binnoma')}
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
            <Shield className="w-3 h-3" />
            <span>
              {t(
                'يُستخدم هذا التطبيق بمسؤولية وأخلاقية فقط. يُمنع استخدامه لأغراض مضللة أو احتيالية.',
                'This application is to be used responsibly and ethically only. It is prohibited for misleading or fraudulent purposes.'
              )}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
