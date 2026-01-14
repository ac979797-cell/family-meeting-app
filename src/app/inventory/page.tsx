'use client'
import { useEffect, useState } from 'react'
//import { supabase } from '@/lib/supabase'
// 기존: import { supabase } from '@/lib/supabase'
import { supabase } from '../../lib/supabase' // 폴더 위치에 맞춰 뒤로 이동

// 1. 함수 이름(InventoryPage)이 반드시 있어야 하고
// 2. 앞에 'export default'가 붙어 있어야 합니다.
export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('whiskey') 
        .select('*')
      console.log(data+'@@@@')
      if (error) {
        console.error("에러 발생!", error)
      } else {
        setItems(data || [])
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">위스키 재고 현황</h1>
      <div className="grid gap-4">
        {items.length > 0 ? (
          items.map((whiskey) => (
            <div key={whiskey.id} className="p-4 border rounded-xl shadow-sm bg-white">
              <h2 className="text-xl font-semibold">{whiskey.whiskeyName}</h2>
              <p className="text-gray-500">{whiskey.price?.toLocaleString()}원</p>
            </div>
          ))
        ) : (
          <p>데이터가 없습니다. Supabase 대시보드에서 데이터를 추가해 보세요!</p>
        )}
      </div>
    </div>
  )
}
      
