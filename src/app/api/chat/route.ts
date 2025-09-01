import { NextRequest, NextResponse } from 'next/server'

// TypeScript interfaces
interface UserProfile {
  id: string
  full_name: string
  role: string
  email?: string
}

interface ClassItem {
  id: string
  name: string
  description?: string
}

// إعدادات Hugging Face Space
const HUGGING_FACE_SPACE_URL = 'https://huggingface.co/spaces/HussienXG/ai-agent/api/predict'
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN || ''

// دالة لإرسال طلب لـ Hugging Face Space
async function queryHuggingFaceSpace(message: string): Promise<string> {
  try {
    console.log('🤖 Calling Hugging Face Space...')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // إضافة token إذا كان متوفراً
    if (HUGGING_FACE_TOKEN) {
      headers['Authorization'] = `Bearer ${HUGGING_FACE_TOKEN}`
    }

    const response = await fetch(HUGGING_FACE_SPACE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [message] // تنسيق البيانات للـ Spaces
      })
    })

    if (!response.ok) {
      throw new Error(`Space API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Space API Response:', result)

    // معالجة النتيجة من Space
    let generatedText = ''

    if (result?.data && Array.isArray(result.data) && result.data[0]) {
      generatedText = result.data[0].trim()
    } else if (result?.data && typeof result.data === 'string') {
      generatedText = result.data.trim()
    } else if (result?.output && typeof result.output === 'string') {
      generatedText = result.output.trim()
    } else {
      console.log('Unexpected Space response format:', result)
      throw new Error('Invalid Space response format')
    }

    // تنظيف النص
    generatedText = generatedText
      .replace(/<\|endoftext\|>/g, '')
      .replace(/<pad>/g, '')
      .replace(/<s>/g, '')
      .replace(/<\/s>/g, '')
      .trim()

    // التأكد من أن الرد مفيد
    if (generatedText.length < 10) {
      throw new Error('Response too short')
    }

    return generatedText

  } catch (error) {
    console.error('Error with Hugging Face Space:', error)
    throw error
  }
}

// دالة لإنشاء سياق تعليمي ذكي
function createEducationalContext(message: string, userProfile: UserProfile | null, classes: ClassItem[]): string {
  const userName = userProfile?.full_name || 'الطالب'
  const userRole = userProfile?.role === 'student' ? '╪╖╪º┘ä╪¿' : userProfile?.role === 'Professor' ? '┘à╪╣┘ä┘à' : '┘à╪»┘è╪▒'

  let context = `أنت مساعد تعليمي ذكي في منصة Study. اسم المستخدم: ${userName}. دوره: ${userRole}.

`

  // إضافة معلومات الفصول إذا كانت متوفرة
  if (classes && classes.length > 0) {
    context += `الفصول النشطة للمستخدم:
`
    classes.slice(0, 3).forEach((classItem, index) => {
      context += `${index + 1}. ${classItem.name}
`
    })
    context += `
`
  }

  // إضافة تعليمات للذكاء الاصطناعي
  context += `مهامك:
- ساعد الطلاب في فهم المواد الدراسية بطريقة تفاعلية
- قدم إجابات مفيدة ومبنية على معرفة حقيقية
- استخدم أمثلة عملية لتوضيح المفاهيم
- كن ودوداً ومشجعاً للطلاب
- أجب باللغة العربية الفصحى
- استخدم الرموز التعبيرية المناسبة لجعل الردود أكثر جاذبية
- إذا كان السؤال بالإنجليزية، أجب بالإنجليزية

السؤال: ${message}

أجب بطريقة طبيعية ومفيدة:`

  return context
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId, userProfile, classes }: {
      message: string
      userId: string
      userProfile: UserProfile | null
      classes: ClassItem[]
    } = body

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('🚀 Processing AI request for:', message.substring(0, 50) + '...')

    let aiResponse: string

    try {
      // إنشاء السياق التعليمي
      const context = createEducationalContext(message, userProfile, classes)
      console.log('📝 Created educational context')

      // محاولة استخدام Hugging Face Space
      console.log('🤖 Calling Hugging Face Space...')
      aiResponse = await queryHuggingFaceSpace(context)

      // تنظيف الإجابة
      aiResponse = aiResponse
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      // التأكد من طول الإجابة
      if (aiResponse.length > 500) {
        aiResponse = aiResponse.substring(0, 500) + '...'
      }

      // التأكد من أن الإجابة مفيدة
      if (aiResponse.length < 20) {
        throw new Error('Response too short')
      }

      console.log('✅ Generated AI response successfully')

    } catch (aiError) {
      console.error('❌ AI Space failed:', aiError)
      // إرجاع رسالة خطأ بدلاً من رمي خطأ
      return NextResponse.json({ response: '❌ عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً.' })
    }

    console.log('📤 Final response:', aiResponse.substring(0, 100) + '...')

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('💥 Error in AI chat API:', error)
    return NextResponse.json({ response: '❌ حدث خطأ غير متوقع في النظام. يرجى المحاولة مرة أخرى.' })
  }
}

