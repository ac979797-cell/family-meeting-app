'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function NewMeetingPage() {
  // --- 상태 관리 ---
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [issues, setIssues] = useState([{ content: '' }])
  const [agendas, setAgendas] = useState([{ content: '' }])
  const [etcIssues, setEtcIssues] = useState([{ content: '' }])
  const [shoppingList, setShoppingList] = useState([{ content: '' }])
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- 1. 이전 데이터 로드 (최근 안건/구매리스트 복사) ---
  // src/app/minutes/new/page.tsx 내부의 useEffect 수정

useEffect(() => {
  async function fetchLastMeeting() {
    // 1. 가장 최근 회의 하나를 찾음
    const { data: lastMeeting } = await supabase
      .from('meetings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMeeting) {
      // 2. 해당 회의에 속한 모든 상세 항목(이슈, 안건 등)을 가져옴
      const { data: details } = await supabase
        .from('meeting_details')
        .select('*')
        .eq('meeting_id', lastMeeting.id);

      if (details && details.length > 0) {
        // 3. 'AGENDA' 타입만 골라서 배열로 만듦
        const prevAgendas = details
          .filter(d => d.item_type === 'AGENDA')
          .map(d => ({ content: d.content }));
        
        // 4. 'SHOPPING' 타입만 골라서 배열로 만듦
        const prevShopping = details
          .filter(d => d.item_type === 'SHOPPING')
          .map(d => ({ content: d.content }));
        console.log(prevAgendas);
        debugger;
        // 5. 상태 업데이트 (가져온 데이터가 있으면 그 개수만큼 입력창이 세팅됨)
        if (prevAgendas.length > 0) setAgendas(prevAgendas);
        if (prevShopping.length > 0) setShoppingList(prevShopping);
      }
    }
  }
  fetchLastMeeting();
}, []);

  // --- 2. 로우 추가/삭제 핸들러 ---
  const addRow = (setter: any, items: any) => setter([...items, { content: '' }])
  const deleteRow = (setter: any, items: any, idx: number) => setter(items.filter((_: any, i: number) => i !== idx))
  const updateContent = (setter: any, items: any, idx: number, value: string) => {
    const newItems = [...items];
    newItems[idx].content = value;
    setter(newItems);
  }

  // --- 3. 저장(Submit) 로직 ---
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // (1) 사진 업로드
      let publicUrl = '';
      if (imgFile) {
        const fileName = `location_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('meeting-locations')
          .upload(fileName, imgFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('meeting-locations').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // (2) 메인 회의록 저장
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .insert({ meeting_date: meetingDate, location_img: publicUrl })
        .select().single();
      if (meetingError) throw meetingError;


      // (3) 세부 항목 가공 및 저장
      const allDetails = [
        ...issues.filter(i => i.content).map(i => ({ meeting_id: meetingData.id, item_type: 'ISSUE', content: i.content })),
        ...agendas.filter(a => a.content).map(a => ({ meeting_id: meetingData.id, item_type: 'AGENDA', content: a.content })),
        ...etcIssues.filter(e => e.content).map(e => ({ meeting_id: meetingData.id, item_type: 'ETC', content: e.content })),
        ...shoppingList.filter(s => s.content).map(s => ({ meeting_id: meetingData.id, item_type: 'SHOPPING', content: s.content })),
      ];

      if (allDetails.length > 0) {
        const { error: detailsError } = await supabase.from('meeting_details').insert(allDetails);
        if (detailsError) throw detailsError;
      }

      const { error } = await supabase
      .from('schedules')
      .insert([
        { 
          title: meetingDate +'_가족회의', 
          category: "",
          start_at: meetingDate,
          description: "" // 필요시 추가 입력창 구현
        }
      ])


      alert('가족 회의록이 저장되었습니다! 🏠');
      window.location.href = '/minutes';
    } catch (err: any) {
      alert('에러 발생: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-32 space-y-8 bg-white min-h-screen">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">📝 새 회의록 작성</h2>

      <section>
        <label className="block text-sm font-bold text-slate-600 mb-2">회의 날짜</label>
        <input type="date" value={meetingDate} onChange={(e)=>setMeetingDate(e.target.value)} className="w-full border p-3 rounded-xl bg-slate-50"/>
      </section>

      <DynamicSection title="1. 이 주의 이슈" items={issues} 
        onChange={(idx: number, val: string) => updateContent(setIssues, issues, idx, val)}
        addRow={() => addRow(setIssues, issues)} 
        deleteRow={(idx: number) => deleteRow(setIssues, issues, idx)} />
        
        


0

      <DynamicSection title="2. 이 주의 안건" items={agendas} 
        onChange={(idx: number, val: string) => updateContent(setAgendas, agendas, idx, val)}
        addRow={() => addRow(setAgendas, agendas)} 
        deleteRow={(idx: number) => deleteRow(setAgendas, agendas, idx)} />

      <DynamicSection title="3. 그 외 이슈" items={etcIssues} 
        onChange={(idx: number, val: string) => updateContent(setEtcIssues, etcIssues, idx, val)}
        addRow={() => addRow(setEtcIssues, etcIssues)} 
        deleteRow={(idx: number) => deleteRow(setEtcIssues, etcIssues, idx)} />

      <DynamicSection title="4. 구매 리스트" items={shoppingList} 
        onChange={(idx: number, val: string) => updateContent(setShoppingList, shoppingList, idx, val)}
        addRow={() => addRow(setShoppingList, shoppingList)} 
        deleteRow={(dx: number) => deleteRow(setShoppingList, shoppingList, idx)} />

      <section>
        <label className="block text-sm font-bold text-slate-600 mb-2">5. 회의 장소 사진</label>
        <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      </section>

      <button 
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition ${isSubmitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isSubmitting ? '저장 중...' : '회의록 저장하기'}
      </button>
    </div>
  )
}

function DynamicSection({ title, items, onChange, addRow, deleteRow }: any) {
  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-extrabold text-slate-700">{title}</label>
        <button onClick={addRow} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ 추가</button>
      </div>
      {items.map((item: any, idx: number) => (
        <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
          <input 
            value={item.content} 
            onChange={(e) => onChange(idx, e.target.value)}
            className="flex-1 border-slate-200 border p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
            placeholder="내용을 입력하세요"
          />
          {items.length > 1 && (
            <button onClick={() => deleteRow(idx)} className="text-slate-300 hover:text-red-500 px-1 transition">✕</button>
          )}
        </div>
      ))}
    </section>
  )
}