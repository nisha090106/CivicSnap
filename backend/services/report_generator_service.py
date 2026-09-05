import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")

def get_nvidia_client():
    if not NVIDIA_API_KEY:
        return None
    try:
        from openai import OpenAI
        return OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=NVIDIA_API_KEY
        )
    except Exception as e:
        print(f"[NVIDIA LLM Init Error]: {e}")
        return None

def synthesize_soap_into_paragraphs(soap: dict) -> tuple:
    """
    Synthesizes raw SOAP transcript into 2 clean formal paragraphs.
    Paragraph 1: Factual Subjective/Objective context & visual location observation.
    Paragraph 2: Risk Assessment & 48-hour SLA action plan request.
    """
    s_val = soap.get("S", "Citizen report logged via CivicSnap mobile portal.")
    o_val = soap.get("O", "Visual evidence confirms physical infrastructure defect.")
    a_val = soap.get("A", "Municipal safety risk requiring prompt intervention.")
    p_val = soap.get("P", "Dispatch field inspection squad for immediate repair within 48h SLA.")

    p1 = f"{s_val} {o_val}".strip()
    p2 = f"{a_val} {p_val}".strip()

    return p1, p2

AUTHORITY_TIERS = {
    "ROAD_TRANSPORT": "Ministry of Road Transport & Highways",
    "MUNICIPAL_CORP": "City wise Municipal Corporation",
    "NAGAR_PANCHAYAT": "Taluka wise Nagar Panchayat",
    "GRAM_PANCHAYAT": "Village wise Gram Panchayat",
    "FOREST_DEPT": "Forest Department",
    "FDA": "Food & Drug Administration (FDA)"
}

def determine_authority_routing(department: str, city_name: str, taluka_name: str) -> Dict[str, str]:
    """
    Multi-Tier Authority Routing Engine:
    Maps complaints to specific authority bodies based on department & administrative boundary.
    """
    dept_lower = (department or "").lower()
    
    if "forest" in dept_lower:
        target = AUTHORITY_TIERS["FOREST_DEPT"]
        contact_email = "forest@civicsnap.gov.in"
    elif "food" in dept_lower or "fda" in dept_lower or "drug" in dept_lower:
        target = AUTHORITY_TIERS["FDA"]
        contact_email = "fooddrug@civicsnap.gov.in"
    elif "road" in dept_lower or "transport" in dept_lower:
        target = AUTHORITY_TIERS["ROAD_TRANSPORT"]
        contact_email = "roadtransport@civicsnap.gov.in"
    else:
        # Administrative boundary hierarchy routing
        if city_name in ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"]:
            target = f"{city_name} {AUTHORITY_TIERS['MUNICIPAL_CORP']}"
            contact_email = "municipal@civicsnap.gov.in"
        elif taluka_name:
            target = f"{taluka_name} {AUTHORITY_TIERS['NAGAR_PANCHAYAT']}"
            contact_email = "nagarpanchayat@civicsnap.gov.in"
        else:
            target = AUTHORITY_TIERS["GRAM_PANCHAYAT"]
            contact_email = "grampanchayat@civicsnap.gov.in"

    return {
        "authority_name": target,
        "contact_email": contact_email
    }

LANGUAGE_TEMPLATES = {
    "en": {
        "title": "FORMAL CIVIC COMPLAINT LETTER",
        "to": "To,",
        "authority": "The Competent Officer / Department Head,",
        "subject": "SUBJECT: Official Complaint Regarding {category} in {city_name}",
        "salutation": "Respected Sir/Madam,",
        "body_intro": "I am writing to formally bring to your urgent attention a critical civic infrastructure issue regarding {category} located at {city_name}, {taluka_name}.",
        "findings": "Key Multi-Modal Vision Analysis & SOAP Assessment:",
        "request": "Therefore, you are requested to urgently inspect the site, issue a work order dispatch, and resolve this hazard within the mandated 48-hour SLA.",
        "sign_anon": "Yours faithfully,\nAnonymous Citizen of {city_name}\n(Sent via CivicSnap Platform)",
        "sign_disclosed": "Yours faithfully,\n{citizen_name}\nRegistered Citizen of {city_name}\n(Verified via CivicSnap Security Portal)"
    },
    "hi": {
        "title": "ऑफ़िशियल नागरिक शिकायत पत्र",
        "to": "सेवा में,",
        "authority": "सक्षम अधिकारी / विभाग प्रमुख,",
        "subject": "विषय: {city_name} में {category} के संबंध में आधिकारिक शिकायत",
        "salutation": "आदरणीय महोदय / महोदया,",
        "body_intro": "मैं {city_name}, {taluka_name} में स्थित {category} से संबंधित एक गंभीर नागरिक समस्या की ओर आपका ध्यान आकर्षित करने हेतु यह पत्र लिख रहा/रही हूँ।",
        "findings": "निरीक्षण और विश्लेषण निष्कर्ष (SOAP रिपोर्ट):",
        "request": "अतः आपसे अनुरोध है कि कृपया तत्काल स्थल का निरीक्षण करें और 48 घंटे की समय सीमा के भीतर समस्या का समाधान कराएं।",
        "sign_anon": "भवदीय,\n{city_name} का नागरिक (अनाम - CivicSnap प्लेटफ़ॉर्म के माध्यम से)",
        "sign_disclosed": "भवदीय,\n{citizen_name}\n{city_name} के पंजीकृत नागरिक\n(CivicSnap सुरक्षा पोर्टल द्वारा सत्यापित)"
    },
    "mr": {
        "title": "अधिकृत नागरिक तक्रार अर्ज",
        "to": "प्रति,",
        "authority": "सक्षम अधिकारी / विभाग प्रमुख,",
        "subject": "विषय: {city_name} येथील {category} बाबत अधिकृत तक्रार",
        "salutation": "आदरणीय महोदय / महोदया,",
        "body_intro": "मी {city_name}, {taluka_name} येथील {category} संदर्भातील गंभीर नागरी समस्येकडे आपले लक्ष वेधण्यासाठी हा अर्ज सादर करत आहे.",
        "findings": "तपासणी आणि विश्लेषण निष्कर्ष (SOAP अहवाल):",
        "request": "तरी आपण त्वरित स्थळ पाहणी करून ४८ तासांच्या आत या समस्येचे निवारण करावे ही नम्र विनंती.",
        "sign_anon": "आपला/आपली नम्र,\n{city_name} येथील नागरिक (अनामित - CivicSnap प्रणालीद्वारे)",
        "sign_disclosed": "आपला/आपली नम्र,\n{citizen_name}\n{city_name} येथील नोंदणीकृत नागरिक\n(CivicSnap द्वारे सत्यापित)"
    },
    "gu": {
        "title": "સત્તાવાર નાગરિક ફરિયાદ પત્ર",
        "to": "પ્રતિ,",
        "authority": "સક્ષમ અધિકારી શ્રી,",
        "subject": "વિષય: {city_name} માં {category} અંગે સત્તાવાર ફરિયાદ",
        "salutation": "આદરણીય મહાશય / મહાશયા,",
        "body_intro": "હું {city_name}, {taluka_name} માં સ્થિત {category} ની ગંભીર સમસ્યા તરફ આપનું ધ્યાન દોરવા માટે આ પત્ર લખી રહ્યો છું.",
        "findings": "વિશ્લેષણ તારણો (SOAP અહેવાલ):",
        "request": "આથી વિનંતી છે કે કૃપા કરીને સ્થળની તપાસ કરો અને 48 કલાકની મર્યાદામાં નિકાલ કરો.",
        "sign_anon": "આપનો વિશ્વાસુ,\n{city_name} ના નાગરિક (અનામી - CivicSnap પોર્ટલ દ્વારા)",
        "sign_disclosed": "આપનો વિશ્વાસુ,\n{citizen_name}\n{city_name} ના નોંધાયેલ નાગરિક\n(CivicSnap પોર્ટલ દ્વારા પ્રમાણિત)"
    },
    "ta": {
        "title": "அதிகாரப்பூர்வ குடிமக்கள் புகார் கடிதம்",
        "to": "பெறுநர்,",
        "authority": "உரிய அதிகாரி / துறைத் தலைவர்,",
        "subject": "பொருள்: {city_name}-இல் உள்ள {category} தொடர்பான புகார்",
        "salutation": "மதிப்பிற்குரிய அய்யா / அம்மா,",
        "body_intro": "{city_name}, {taluka_name} பகுதியில் உள்ள {category} தொடர்பான முக்கிய பிரச்சனையை உங்கள் கவனத்திற்கு கொண்டு வருகிறேன்.",
        "findings": "ஆய்வு மற்றும் பகுப்பாய்வு (SOAP அறிக்கை):",
        "request": "எனவே, உடனடியாக கள ஆய்வு செய்து 48 மணி நேரத்திற்குள் நடவடிக்கை எடுக்குமாறு கேட்டுக்கொள்கிறேன்.",
        "sign_anon": "இங்ஙனம்,\n{city_name} குடிமகன் (அநாமதேய - CivicSnap மூலம்)",
        "sign_disclosed": "இங்ஙனம்,\n{citizen_name}\n{city_name} பதிவுசெய்த குடிமகன்\n(CivicSnap மூலம் சரிபார்க்கப்பட்டது)"
    }
}

def generate_formal_letter(
    soap_data: Dict[str, Any],
    disclose_identity: bool = False,
    citizen_name: str = None,
    language: str = "en"
) -> str:
    """
    Template Fallback Generator:
    Converts SOAP data into a concise formal complaint letter (< 200 words).
    """
    lang = language.lower() if language and language.lower() in LANGUAGE_TEMPLATES else "en"
    tpl = LANGUAGE_TEMPLATES[lang]

    city_name = soap_data.get("city_name", "Mumbai")
    taluka_name = soap_data.get("taluka_name", "Central")
    department = soap_data.get("department", "Municipal Corporation")
    category = soap_data.get("category", "Civic Issue")
    soap = soap_data.get("soap_structure", {})

    routing = determine_authority_routing(department, city_name, taluka_name)
    authority_name = routing["authority_name"]
    category_names = {
        "en": category,
        "hi": {"Road & Pothole": "सड़क और गड्ढा", "Waste / Garbage": "कचरा", "Water Leakage": "पानी का रिसाव", "Street Light / Wire": "स्ट्रीट लाइट या तार"}.get(category, category),
        "mr": {"Road & Pothole": "रस्ता आणि खड्डा", "Waste / Garbage": "कचरा", "Water Leakage": "पाण्याची गळती", "Street Light / Wire": "पथदिवा किंवा तार"}.get(category, category),
        "gu": {"Road & Pothole": "રસ્તો અને ખાડો", "Waste / Garbage": "કચરો", "Water Leakage": "પાણીનું લીકેજ", "Street Light / Wire": "સ્ટ્રીટ લાઇટ અથવા વાયર"}.get(category, category),
        "ta": {"Road & Pothole": "சாலை மற்றும் பள்ளம்", "Waste / Garbage": "குப்பை", "Water Leakage": "நீர் கசிவு", "Street Light / Wire": "தெருவிளக்கு அல்லது கம்பி"}.get(category, category)
    }[lang]
    localized_labels = {
        "en": ("Department", "Jurisdiction", "Official complaint regarding {category} in {city_name}"),
        "hi": ("विभाग", "क्षेत्र", "{city_name} में {category} के संबंध में आधिकारिक शिकायत"),
        "mr": ("विभाग", "अधिकारक्षेत्र", "{city_name} येथील {category} बाबत अधिकृत तक्रार"),
        "gu": ("વિભાગ", "અધિકારક્ષેત્ર", "{city_name}માં {category} અંગે સત્તાવાર ફરિયાદ"),
        "ta": ("துறை", "செயல் எல்லை", "{city_name} நகரில் உள்ள {category} தொடர்பான அதிகாரப்பூர்வ புகார்")
    }[lang]
    notices = {
        "en": f"NOTICE: This report was submitted anonymously by a citizen of {city_name} via CivicSnap.",
        "hi": f"सूचना: यह शिकायत CivicSnap के माध्यम से {city_name} के एक नागरिक ने गुमनाम रूप से भेजी है।",
        "mr": f"सूचना: ही तक्रार CivicSnap द्वारे {city_name} येथील नागरिकाने अनामिकपणे पाठवली आहे।",
        "gu": f"સૂચના: આ ફરિયાદ CivicSnap દ્વારા {city_name}ના નાગરિકે અનામી રીતે મોકલી છે.",
        "ta": f"அறிவிப்பு: இந்த புகார் CivicSnap மூலம் {city_name} நகர குடிமகனால் அநாமதேயமாக அனுப்பப்பட்டது."
    }
    notice = notices[lang]
    if disclose_identity and citizen_name:
        notice = {
            "en": f"NOTICE: Identity disclosed by {citizen_name}; verified through CivicSnap.",
            "hi": f"सूचना: पहचान साझा की गई है: {citizen_name}। CivicSnap द्वारा सत्यापित।",
            "mr": f"सूचना: ओळख जाहीर केली आहे: {citizen_name}। CivicSnap द्वारे सत्यापित।",
            "gu": f"સૂચના: ઓળખ જાહેર કરવામાં આવી છે: {citizen_name}. CivicSnap દ્વારા ચકાસાયેલ.",
            "ta": f"அறிவிப்பு: அடையாளம் தெரிவிக்கப்பட்டுள்ளது: {citizen_name}. CivicSnap மூலம் சரிபார்க்கப்பட்டது."
        }[lang]
    signer = citizen_name if disclose_identity and citizen_name else {
        "en": f"Anonymous citizen of {city_name}",
        "hi": f"{city_name} का नागरिक",
        "mr": f"{city_name} येथील नागरिक",
        "gu": f"{city_name}ના નાગરિક",
        "ta": f"{city_name} நகர குடிமகன்"
    }[lang]

    return f"""{notice}

{tpl['to']}
{authority_name}
{localized_labels[0]}: {department}
{localized_labels[1]}: {city_name}, {taluka_name}

{localized_labels[2].format(category=category_names, city_name=city_name)}

{tpl['salutation']}

{tpl['body_intro'].format(category=category_names, city_name=city_name, taluka_name=taluka_name)}

{tpl['findings']} {tpl['request']}

{tpl['sign_disclosed'].format(citizen_name=signer, city_name=city_name) if disclose_identity and citizen_name else tpl['sign_anon'].format(city_name=city_name)}"""

def generate_llm_formal_letter_nvidia(
    soap_data: Dict[str, Any],
    disclose_identity: bool = False,
    citizen_name: str = None,
    language: str = "en"
) -> str:
    """
    Generates a formal municipal complaint letter dynamically using NVIDIA Nemotron 3.5 Lightning LLM.
    Converts SOAP analysis into exactly 2 concise formal paragraphs (< 200 words total).
    Handles identity disclosure vs anonymous header.
    """
    city_name = soap_data.get("city_name", "Mumbai")
    taluka_name = soap_data.get("taluka_name", "Central")
    department = soap_data.get("department", "Municipal Corporation")
    category = soap_data.get("category", "Civic Issue")
    soap = soap_data.get("soap_structure", {})

    routing = determine_authority_routing(department, city_name, taluka_name)
    authority_name = routing["authority_name"]

    p1_soap, p2_soap = synthesize_soap_into_paragraphs(soap)

    lang_name_map = {
        "en": "English",
        "hi": "Hindi (हिंदी)",
        "mr": "Marathi (मराठी)",
        "gu": "Gujarati (ગુજરાતી)",
        "ta": "Tamil (தமிழ்)"
    }
    target_lang = lang_name_map.get(language.lower() if language else "en", "English")

    if disclose_identity and citizen_name:
        header_notice = f"NOTICE: The Citizen has Disclosed Identity: {citizen_name} (Verified via CivicSnap Mobile Auth)"
        signature_instruction = f"Signed as: Registered Citizen '{citizen_name}', {city_name}"
    else:
        header_notice = f"NOTICE: The Report is sent Anonymously as it is sent as reported by Citizen of {city_name} via CivicSnap"
        signature_instruction = f"Signed as: Anonymous Citizen of {city_name}"

    prompt = f"""You are an official municipal AI drafting assistant for CivicSnap.
Write a concise formal civic complaint letter addressed to '{authority_name}' regarding a '{category}' issue in {city_name}, {taluka_name}.

CRITICAL REQUIREMENTS:
1. WORD COUNT: Under 200 words total.
2. LANGUAGE: The ENTIRE letter, including all salutations, headers, labels, body paragraphs, and closing, MUST be written entirely and naturally in {target_lang}. Do not leave any English words, labels, or structural headers untranslated. Do not mix languages.
3. Do not output reasoning, thinking process, or markdown code blocks. Output only the final letter text.
4. STRUCTURE: Write the actual content of every part in {target_lang}, using natural formal-letter conventions for that language:
   - Opening notice line conveying: {header_notice}
   - Recipient line naming {authority_name}, {department}, {city_name}, and {taluka_name}
   - Subject line about {category} in {city_name}
   - Formal salutation
   - First paragraph describing context and findings, based on this source information: "{p1_soap}"
   - Second paragraph describing risk and the requested 48-hour SLA action, based on this source information: "{p2_soap}"
   - Closing conveying: {signature_instruction}

Write ONLY in {target_lang} throughout. Translate the source information and all structural elements; never copy English labels or phrases into the letter. Keep it concise, direct, professional, and under 200 words."""

    client = get_nvidia_client()
    if client:
        try:
            print(f"[NVIDIA Nemotron 3.5 LLM] Generating concise formal complaint letter in {target_lang}...")
            completion = client.chat.completions.create(
                model="nvidia/nemotron-3.5-lightning-30b-a3b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                top_p=0.9,
                max_tokens=450,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": False}
                }
            )

            if completion.choices and completion.choices[0].message.content:
                letter_text = completion.choices[0].message.content.strip()

                # Clean any residual thinking process scratchpad text if present
                if "NOTICE:" in letter_text:
                    idx = letter_text.find("NOTICE:")
                    letter_text = letter_text[idx:]

                word_count = len(letter_text.split())
                print(f"[NVIDIA Nemotron 3.5 LLM Success] Generated concise letter ({word_count} words)")
                return letter_text
        except Exception as e:
            print(f"[NVIDIA Nemotron LLM Error]: {e}. Falling back to template generator.")

    # Fallback to template generator if LLM call fails
    return generate_formal_letter(
        soap_data=soap_data,
        disclose_identity=disclose_identity,
        citizen_name=citizen_name,
        language=language
    )

def generate_llm_complaint_report(
    soap_data: Dict[str, Any],
    image_url: str,
    user_notes: str = "",
    disclose_identity: bool = False,
    citizen_name: str = None,
    language: str = "en"
) -> Dict[str, Any]:
    """
    LLM Complaint Report Generator:
    Synthesizes SOAP transcript + multi-modal analysis into a standardized,
    actionable municipal civic complaint document using NVIDIA Nemotron LLM.
    """
    city_name = soap_data.get("city_name", "Mumbai")
    taluka_name = soap_data.get("taluka_name", "Central")
    department = soap_data.get("department", "Municipal Corporation")

    routing = determine_authority_routing(department, city_name, taluka_name)
    authority_name = routing["authority_name"]

    if disclose_identity and citizen_name:
        header_notice = f"The Citizen has Disclosed Identity: {citizen_name} (Verified via CivicSnap Mobile Auth)"
    else:
        header_notice = f"The Report is sent Anonymously as it is sent as reported by Citizen of {city_name} via CivicSnap"

    formal_letter = generate_llm_formal_letter_nvidia(
        soap_data=soap_data,
        disclose_identity=disclose_identity,
        citizen_name=citizen_name,
        language=language
    )

    return {
        "complaint_report": formal_letter,
        "header_notice": header_notice,
        "authority_name": authority_name,
        "contact_email": routing["contact_email"]
    }
