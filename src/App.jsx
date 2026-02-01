import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Trash2, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Grid, List, Columns, LogIn, LogOut, X,
  Settings2, CalendarRange, Trash, Eye, Palette, Check, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, startOfYear, endOfYear,
  eachMonthOfInterval, addYears, setMonth, setYear, isWithinInterval, parseISO,
  getWeekOfMonth, isSaturday, isSunday
} from 'date-fns'
import { ko } from 'date-fns/locale'
import './index.css'

// --- Holidays 2026 (South Korea) ---
const HOLIDAYS_2026 = {
  '2026-01-01': '신정',
  '2026-02-16': '설날',
  '2026-02-17': '설날',
  '2026-02-18': '설날',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일',
  '2026-09-24': '추석',
  '2026-09-25': '추석',
  '2026-09-26': '추석',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',
}

const getDayColorClass = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd')
  if (HOLIDAYS_2026[dateStr]) return 'day-holiday'
  const day = date.getDay()
  if (day === 0) return 'day-sun'
  if (day === 6) return 'day-sat'
  return ''
}

// --- Sorting Logic ---
const sortSchedules = (list) => {
  if (!list || !Array.isArray(list)) return []
  return [...list].sort((a, b) => {
    const timeA = String(a.time || '')
    const timeB = String(b.time || '')
    if (!timeA && !timeB) return 0
    if (!timeA) return 1
    if (!timeB) return -1
    return timeA.localeCompare(timeB)
  })
}

// --- Sub-Components ---

const Header = ({ currentDate, viewMode, onPrev, onNext, onShowPicker, onGoToday }) => {
  const fullDateStr = format(currentDate, 'yyyy년 MMMM d일 (EEEE)', { locale: ko })
  const monthStr = format(currentDate, 'yyyy년 MMMM', { locale: ko })
  const yearStr = format(currentDate, 'yyyy년')

  // 주간 뷰를 위한 '몇째주' 계산
  const weekNum = getWeekOfMonth(currentDate, { locale: ko, weekStartsOn: 0 })
  const weekTerms = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째']
  const weekStr = `${format(currentDate, 'yyyy년 MMMM', { locale: ko })} ${weekTerms[weekNum - 1]}주`

  let displayStr = monthStr
  if (viewMode === 'day') displayStr = fullDateStr
  if (viewMode === 'week') displayStr = weekStr
  if (viewMode === 'year') displayStr = yearStr

  // --- Fast Time Input Helper ---
  const formatTimeKey = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 8)
    if (cleaned.length >= 4) {
      const hh1 = cleaned.slice(0, 2)
      const mm1 = cleaned.slice(2, 4)
      let out = `${hh1}:${mm1}`
      if (cleaned.length > 4) {
        const hh2 = cleaned.slice(4, 6)
        const mm2 = cleaned.slice(6, 8)
        out += ` ~ ${hh2}:${mm2}`
      }
      return out
    }
    return val
  }

  const colorClass = viewMode === 'day' ? getDayColorClass(currentDate) : ''

  return (
    <div className="calendar-header">
      <div
        className="brand-logo"
        onClick={onGoToday}
        title="오늘로 이동"
      >
        <CalendarIcon size={32} color="#818cf8" />
        <h1 style={{ margin: 0, fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.8rem' }}>
          Diary Pro
        </h1>
      </div>

      <div className="date-selector">
        <button className="nav-btn" onClick={onPrev} title="이전"><ChevronLeft size={24} /></button>
        <div className="date-info-container" onClick={onShowPicker}>
          <span className={`current-date-text ${colorClass}`}>{displayStr}</span>
          {(viewMode === 'month' || viewMode === 'week') && (
            <span className="date-subtext">클릭하여 날짜 이동</span>
          )}
        </div>
        <button className="nav-btn" onClick={onNext} title="다음"><ChevronRight size={24} /></button>
      </div>

      <button className="google-btn">
        <LogIn size={18} />
        Google Sync
      </button>
    </div>
  )
}

const MonthPicker = ({ show, currentDate, onClose, onChangeDate }) => {
  const months = Array.from({ length: 12 }, (_, i) => i)
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-overlay" onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="modal-content" onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <button className="nav-btn" onClick={() => onChangeDate(addYears(currentDate, -1))}>
                <ChevronLeft size={20} />
              </button>
              <div className="modal-title">
                {format(currentDate, 'yyyy년')}
              </div>
              <button className="nav-btn" onClick={() => onChangeDate(addYears(currentDate, 1))}>
                <ChevronRight size={20} />
              </button>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="month-picker-grid">
              {months.map(m => (
                <button
                  key={m}
                  className={`month-opt ${currentDate.getMonth() === m ? 'active' : ''}`}
                  onClick={() => {
                    onChangeDate(setMonth(currentDate, m))
                    onClose()
                  }}
                >
                  {m + 1}월
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const DeleteConfirmModal = ({ show, todo, onClose, onDelete }) => {
  const [deleteMode, setDeleteMode] = useState('single')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  useEffect(() => {
    if (todo && show) {
      setRangeStart(todo.minDate || todo.dateKey)
      setRangeEnd(todo.maxDate || todo.dateKey)
      setDeleteMode('single')
    }
  }, [todo, show])

  if (!todo) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-overlay" onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="modal-content delete-modal" onClick={e => e.stopPropagation()}
          >
            <h2 className="modal-title" style={{ marginBottom: '1rem', color: '#f87171' }}>할 일 삭제</h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>"{todo.text}" 항목을 어떻게 삭제할까요?</p>

            <div className="delete-options">
              <button className={`delete-opt-btn ${deleteMode === 'single' ? 'active' : ''}`} onClick={() => setDeleteMode('single')}>
                이 날짜만 삭제
              </button>
              <button className={`delete-opt-btn ${deleteMode === 'batch' ? 'active' : ''}`} onClick={() => setDeleteMode('batch')}>
                전체 기간 삭제
              </button>
              <button className={`delete-opt-btn ${deleteMode === 'range' ? 'active' : ''}`} onClick={() => setDeleteMode('range')}>
                특정 기간 삭제
              </button>
            </div>

            {deleteMode === 'range' && (
              <div className="range-picker-container" style={{ marginTop: '1.5rem' }}>
                <div className="input-range-group">
                  <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
                  <span>~</span>
                  <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', gap: '0.8rem' }}>
              <button className="confirm-delete-btn" onClick={() => onDelete(deleteMode, { start: rangeStart, end: rangeEnd })}>
                <Trash size={18} style={{ marginRight: '6px' }} />
                삭제 실행
              </button>
              <button className="cancel-btn" onClick={onClose}>취소</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const PeriodInfoModal = ({ show, todo, initialRanges, onClose, onSaveChanges, colorPresets, setColorPresets }) => {
  const [tempRanges, setTempRanges] = useState([])
  const [tempColor, setTempColor] = useState('')
  const [tempTimeStart, setTempTimeStart] = useState('')
  const [tempTimeEnd, setTempTimeEnd] = useState('')

  useEffect(() => {
    if (todo && show) {
      setTempColor(todo.color || '')
      // Deep copy ranges
      setTempRanges(initialRanges.map(r => ({ ...r })))

      // Parse time if schedule
      if (todo.time) {
        const parts = todo.time.split(' ~ ')
        if (parts.length === 2) {
          setTempTimeStart(parts[0])
          setTempTimeEnd(parts[1])
        } else {
          // Handle single time or malformed
          setTempTimeStart(todo.time)
          setTempTimeEnd('')
        }
      } else {
        setTempTimeStart('')
        setTempTimeEnd('')
      }
    }
  }, [todo, show, initialRanges])

  const modalSchStartRef = useRef(null)
  const modalSchEndRef = useRef(null)

  const handleModalTimeChange = (type, val) => {
    let digits = val.replace(/\D/g, '')
    if (type === 'start') {
      if (digits.length === 8) {
        setTempTimeStart(digits.slice(0, 2) + ':' + digits.slice(2, 4))
        setTempTimeEnd(digits.slice(4, 6) + ':' + digits.slice(6, 8))
        setTimeout(() => modalSchEndRef.current?.focus(), 0)
        return
      }
      let formatted = digits
      if (digits.length >= 3) {
        formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4)
      }
      setTempTimeStart(formatted)
      if (digits.length === 4) {
        setTimeout(() => modalSchEndRef.current?.focus(), 0)
      }
    } else {
      let formatted = digits
      if (digits.length >= 3) {
        formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4)
      }
      setTempTimeEnd(formatted)
    }
  }

  const handleRangeChange = (idx, field, value) => {
    const newRanges = [...tempRanges]
    newRanges[idx][field] = value
    setTempRanges(newRanges)
  }

  const addNewRangeRow = () => {
    setTempRanges([...tempRanges, { start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }])
  }

  const removeRangeRow = (idx) => {
    const newRanges = tempRanges.filter((_, i) => i !== idx)
    setTempRanges(newRanges)
  }

  const constructTime = () => {
    if (!tempTimeStart && !tempTimeEnd) return ''
    if (tempTimeStart && tempTimeEnd) return `${tempTimeStart} ~ ${tempTimeEnd}`
    return tempTimeStart || tempTimeEnd
  }

  if (!todo) return null
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-overlay" onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="modal-content period-modal" onClick={e => e.stopPropagation()}
            style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
          >
            <div className="modal-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="modal-title" style={{ fontSize: '1.3rem', margin: 0 }}>색상 및 기간 수정</h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                  <strong>"{todo.text}"</strong> 설정
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>색상:</span>
                  <ColorPicker
                    selectedColor={tempColor}
                    onSelectColor={setTempColor}
                    presets={colorPresets}
                    onUpdatePreset={(idx, newColor) => {
                      const next = [...colorPresets]
                      next[idx] = newColor
                      setColorPresets(next)
                    }}
                  />
                </div>
              </div>

              {/* Time Editor for Schedule */}
              {(todo.type === 'schedule' || (todo.id && todo.id.startsWith('sch-'))) && (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>시간:</span>
                    <div className="bulk-inputs">
                      <input
                        type="text"
                        ref={modalSchStartRef}
                        value={tempTimeStart}
                        onChange={(e) => handleModalTimeChange('start', e.target.value)}
                        placeholder="00:00"
                      />
                      <span className="range-sep">~</span>
                      <input
                        type="text"
                        ref={modalSchEndRef}
                        value={tempTimeEnd}
                        onChange={(e) => handleModalTimeChange('end', e.target.value)}
                        placeholder="00:00"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="period-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 'bold' }}>등록된 기간</label>
                  <button onClick={addNewRangeRow} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>+ 기간 추가</button>
                </div>

                {tempRanges.map((range, idx) => (
                  <div key={idx} className="period-item" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div className="input-range-group" style={{ flex: 1, padding: '5px' }}>
                      <input type="date" value={range.start} onChange={e => handleRangeChange(idx, 'start', e.target.value)} />
                      <span style={{ opacity: 0.5 }}>~</span>
                      <input type="date" value={range.end} onChange={e => handleRangeChange(idx, 'end', e.target.value)} />
                    </div>
                    {/* Allow removing this row from the edit list */}
                    <button onClick={() => removeRangeRow(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {tempRanges.length === 0 && <p style={{ opacity: 0.4, textAlign: 'center', padding: '1rem' }}>기간이 없습니다.</p>}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', gap: '0.8rem' }}>
              <button
                className="add-btn"
                style={{ flex: 1, padding: '0.8rem' }}
                onClick={() => onSaveChanges(todo, tempRanges, tempColor, tempTimeStart, tempTimeEnd)}
              >
                확인 (저장)
              </button>
              <button
                className="cancel-btn"
                style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                onClick={onClose}
              >
                취소
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ViewSwitcher = ({ viewMode, setViewMode }) => (
  <div className="view-switcher">
    {[
      { id: 'year', label: '연간', icon: Grid },
      { id: 'month', label: '월간', icon: CalendarIcon },
      { id: 'week', label: '주간', icon: Columns },
      { id: 'day', label: '일간', icon: List }
    ].map(v => (
      <button
        key={v.id}
        className={`view-btn ${viewMode === v.id ? 'active' : ''}`}
        onClick={() => setViewMode(v.id)}
      >
        <v.icon size={16} style={{ marginRight: '6px' }} />
        {v.label}
      </button>
    ))}
  </div>
)

const MonthView = ({ currentDate, todosByDate, onSelectDate, schedulesByDate = {} }) => {
  const monthStart = startOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  // 항상 6주(42일)를 보여주도록 설정
  const days = Array.from({ length: 42 }, (_, i) => addDays(startDate, i))

  return (
    <div className="month-grid">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        const hasTodos = todosByDate[key]?.length > 0
        const schedules = schedulesByDate[key] || []
        const dayOfWeek = format(day, 'E', { locale: ko })
        const colorClass = getDayColorClass(day)

        return (
          <div
            key={key}
            className={`day-cell ${!isSameMonth(day, monthStart) ? 'dimmed' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
            onClick={() => onSelectDate(day)}
          >
            <div className={`day-info ${colorClass}`}>
              <span className="day-num">{format(day, 'd')}</span>
              <span className="day-name">({dayOfWeek})</span>
              {HOLIDAYS_2026[key] && <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>{HOLIDAYS_2026[key]}</span>}
            </div>

            {/* Schedule Items in Month View */}
            <div className={`month-sch-container ${schedules.length > 3 ? 'grid-mode' : ''}`}>
              {sortSchedules(schedules).slice(0, schedules.length > 3 ? 6 : 3).map(sch => (
                <div key={sch.id} className="month-sch-item" style={{
                  borderLeft: `2px solid ${sch.color || '#3b82f6'}`
                }}>
                  {sch.text}
                </div>
              ))}
              {schedules.length > (schedules.length > 3 ? 6 : 3) && (
                <div className="more-count">
                  + {schedules.length - (schedules.length > 3 ? 6 : 3)}
                </div>
              )}
            </div>

            {/* Todo Dots (Moved to Bottom) */}
            <div className="dots-container">
              {(todosByDate[key] || []).slice(0, 8).map(todo => (
                <div
                  key={todo.id}
                  className="dot-indicator"
                  style={{
                    backgroundColor: todo.color || '#6366f1',
                    boxShadow: `0 0 4px ${todo.color || '#6366f1'}66`
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const YearView = ({ currentDate, onSelectMonth }) => {
  const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) })
  return (
    <div className="year-grid-pro">
      {months.map(m => (
        <div key={m.toString()} className="mini-month" onClick={() => onSelectMonth(m)}>
          <div className="mini-month-title">{format(m, 'MMMM', { locale: ko })}</div>
          <div className="mini-month-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`mini-day-header ${i === 0 ? 'day-sun' : i === 6 ? 'day-sat' : ''}`}>{d[0]}</div>
            ))}
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(m)), end: endOfWeek(endOfMonth(m)) }).map(d => {
              const colorClass = getDayColorClass(d)
              return (
                <div
                  key={d.toString()}
                  className={`mini-day-cell ${!isSameMonth(d, m) ? 'mini-dimmed' : ''} ${isSameDay(d, new Date()) ? 'mini-today' : ''} ${colorClass}`}
                >
                  {isSameMonth(d, m) ? format(d, 'd') : ''}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const ColorPicker = ({ selectedColor, onSelectColor, presets, onUpdatePreset }) => {
  const isCustomColor = selectedColor && !presets.includes(selectedColor)

  return (
    <div className="color-picker" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div className="presets" style={{ display: 'flex', gap: '8px' }}>
        <div
          className={`color-chip none ${selectedColor === '' ? 'selected' : ''}`}
          onClick={() => onSelectColor('')}
          title="색상 없음"
        >
          {selectedColor === '' && <Check size={14} color="white" />}
        </div>
        {presets.map((color, idx) => (
          <div
            key={idx}
            className={`color-chip ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            onContextMenu={(e) => {
              e.preventDefault()
              const newColor = prompt('새로운 색상 코드를 입력하세요 (예: #ff0000)', color)
              if (newColor) onUpdatePreset(idx, newColor)
            }}
            title="클릭: 선택 | 우클릭: 색상 변경"
          >
            {selectedColor === color && <Check size={14} color="white" />}
          </div>
        ))}
      </div>
      <div className="custom-palette">
        <label
          title="팔레트에서 선택"
          style={{
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '50%',
            background: isCustomColor ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: isCustomColor ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <Palette size={20} color={selectedColor || "#ffffff"} />
          {isCustomColor && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#6366f1',
              borderRadius: '50%',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Check size={10} color="white" />
            </div>
          )}
          <input
            type="color"
            value={selectedColor || "#ffffff"}
            onChange={(e) => onSelectColor(e.target.value)}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  )
}

const DayView = ({
  currentTodos, inputValue, setInputValue, addTodo, toggleTodo,
  deleteTodo, viewPeriod, isBulk, setIsBulk, bulkRange, setBulkRange,
  selectedColor, setSelectedColor, colorPresets, setColorPresets,
  todosByDate, schedulesByDate,
  // New props for schedule
  currentSchedules, scheduleInputValue, setScheduleInputValue, addSchedule, deleteSchedule,
  showScheduleTime, setShowScheduleTime,
  scheduleTimeStart, setScheduleTimeStart, scheduleTimeEnd, setScheduleTimeEnd,
  scheduleColor, setScheduleColor,
  schStartRef, schEndRef, handleSchTimeChange
}) => {
  // 특정 할 집/일정이 등록된 기간(시작~끝)을 계산하는 함수
  const getPeriodRange = (item) => {
    const isSchedule = item.type === 'schedule' || (item.id && item.id.startsWith('sch-'))
    const sourceData = isSchedule ? schedulesByDate : todosByDate

    const dates = []
    Object.keys(sourceData).forEach(d => {
      const isMatch = item.batchId
        ? sourceData[d].some(t => t.batchId === item.batchId)
        : sourceData[d].some(t => t.text === item.text && t.createdAt === item.createdAt)

      if (isMatch) dates.push(parseISO(d))
    })

    if (dates.length <= 1) return null

    const sorted = dates.sort((a, b) => a - b)
    return {
      start: format(sorted[0], 'MM.dd'),
      end: format(sorted[sorted.length - 1], 'MM.dd')
    }
  }

  return (
    <div className="day-view-container">
      {/* Left Column: Todos */}
      <div className="day-column todo-column">
        <h3 className="column-title">할 일 (To-Do)</h3>
        <div className="input-section">
          <form onSubmit={addTodo} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="할 일을 입력하세요..."
                  className="todo-input"
                />
                <button type="submit" className="add-btn"><Plus size={24} /></button>
              </div>

              <div className="bulk-toggle-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    type="button"
                    className={`bulk-toggle-btn ${isBulk ? 'active' : ''}`}
                    onClick={() => setIsBulk(!isBulk)}
                  >
                    <CalendarRange size={16} />
                    <span>기간</span>
                  </button>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isBulk ? 1 : 0 }}
                    style={{ pointerEvents: isBulk ? 'auto' : 'none' }}
                    className="bulk-inputs"
                  >
                    <input type="date" value={bulkRange.start} onChange={e => setBulkRange({ ...bulkRange, start: e.target.value })} />
                    <span className="range-sep">~</span>
                    <input type="date" value={bulkRange.end} onChange={e => setBulkRange({ ...bulkRange, end: e.target.value })} />
                  </motion.div>
                </div>

                <ColorPicker
                  selectedColor={selectedColor}
                  onSelectColor={setSelectedColor}
                  presets={colorPresets}
                  onUpdatePreset={(idx, newColor) => {
                    const next = [...colorPresets]
                    next[idx] = newColor
                    setColorPresets(next)
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="todo-list">
          <AnimatePresence mode="popLayout">
            {currentTodos.map(todo => (
              <motion.div
                key={todo.id}
                layout
                className="todo-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ borderLeft: todo.color ? `4px solid ${todo.color}` : 'none' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.completed ? <CheckCircle2 size={20} color="#10b981" /> : <Circle size={20} color={todo.color || "rgba(255,255,255,0.3)"} />}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      className={`todo-text ${todo.completed ? 'completed' : ''}`}
                      style={{ color: (!todo.completed && todo.color) ? todo.color : 'inherit' }}
                    >
                      {todo.text}
                    </span>
                    {/* Batch tag removed */}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {(() => {
                    const range = getPeriodRange(todo)
                    return range ? (
                      <span className="period-badge">
                        <CalendarRange size={12} />
                        {range.start} ~ {range.end}
                      </span>
                    ) : null
                  })()}
                  <button className="view-period-btn" onClick={() => viewPeriod(todo)} title="기간 보기"><Eye size={18} /></button>
                  <button className="delete-btn" onClick={() => deleteTodo(todo)} title="삭제"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {currentTodos.length === 0 && <p style={{ opacity: 0.4, marginTop: '3rem' }}>등록된 할 일이 없습니다.</p>}
        </div>
      </div>

      {/* Right Column: Schedules */}
      <div className="day-column schedule-column">
        <h3 className="column-title">일정 (Schedule)</h3>
        <div className="input-section">
          <form onSubmit={addSchedule} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input
                  type="text"
                  value={scheduleInputValue}
                  onChange={(e) => setScheduleInputValue(e.target.value)}
                  placeholder="일정을 입력하세요..."
                  className="todo-input"
                />
                <button type="submit" className="add-btn add-btn-sch"><Plus size={24} /></button>
              </div>


              <div className="bulk-toggle-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', minHeight: '42px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Time Toggle Button */}
                  <button
                    type="button"
                    className={`bulk-toggle-btn ${showScheduleTime ? 'active' : ''}`}
                    onClick={() => setShowScheduleTime(!showScheduleTime)}
                  >
                    <Clock size={16} />
                    <span>시간</span>
                  </button>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: showScheduleTime ? 1 : 0,
                      pointerEvents: showScheduleTime ? 'auto' : 'none',
                    }}
                    style={{ pointerEvents: showScheduleTime ? 'auto' : 'none' }}
                    className="bulk-inputs"
                  >
                    <input
                      type="text"
                      ref={schStartRef}
                      value={scheduleTimeStart}
                      onChange={(e) => handleSchTimeChange('start', e.target.value)}
                      placeholder="00:00"
                    />
                    <span className="range-sep">~</span>
                    <input
                      type="text"
                      ref={schEndRef}
                      value={scheduleTimeEnd}
                      onChange={(e) => handleSchTimeChange('end', e.target.value)}
                      placeholder="00:00"
                    />
                  </motion.div>
                </div>

                <ColorPicker
                  selectedColor={scheduleColor}
                  onSelectColor={setScheduleColor}
                  presets={colorPresets}
                  onUpdatePreset={(idx, newColor) => {
                    const next = [...colorPresets]
                    next[idx] = newColor
                    setColorPresets(next)
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="schedule-list">
          <AnimatePresence mode="popLayout">
            {(currentSchedules || []).map(sch => (
              <motion.div
                key={sch.id}
                layout
                className="schedule-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ borderLeft: `4px solid ${sch.color || '#3b82f6'}` }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="todo-text">{sch.text}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {sch.time && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#93c5fd', fontWeight: '600', padding: '2px 6px', background: 'rgba(59,130,246,0.1)', borderRadius: '4px' }}>
                      {sch.time}
                    </span>
                  )}
                  {(() => {
                    const range = getPeriodRange(sch)
                    return range ? (
                      <span className="period-badge">
                        <CalendarRange size={12} />
                        {range.start} ~ {range.end}
                      </span>
                    ) : null
                  })()}
                  <button className="view-period-btn" onClick={() => viewPeriod(sch)} title="기간 수정">
                    <Eye size={16} />
                  </button>
                  <button className="delete-btn" onClick={() => deleteSchedule(sch.id)} title="삭제">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {(!currentSchedules || currentSchedules.length === 0) && <p style={{ opacity: 0.4, marginTop: '3rem' }}>등록된 일정이 없습니다.</p>}
        </div>
      </div>
    </div>
  )
}

// --- Weekly View Component ---
const WeekView = ({ currentDate, todosByDate, onSelectDate, toggleTodo, schedulesByDate = {} }) => {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 })
  const end = addDays(start, 6)
  const days = eachDayOfInterval({ start, end })
  return (
    <div className="week-grid">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        const tasks = todosByDate[key] || []
        const schedules = schedulesByDate[key] || []

        const isSat = isSaturday(day)
        const isSun = isSunday(day)
        const isHoliday = HOLIDAYS_2026[key]
        let colorClass = ''
        if (isSun || isHoliday) colorClass = 'text-red-400'
        else if (isSat) colorClass = 'text-blue-400 text-opacity-80'

        return (
          <div key={key} className="week-day-column" onClick={() => onSelectDate(day)}>
            <div className={`week-day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
              <span className={`week-day-name ${colorClass}`}>{format(day, 'EEEE', { locale: ko })}</span>
              <span className={`week-day-num ${colorClass}`}>{format(day, 'd')}일</span>
              <div className="holiday-name-area">
                {HOLIDAYS_2026[key] && (
                  <span className="day-holiday" style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                    {HOLIDAYS_2026[key]}
                  </span>
                )}
              </div>
            </div>
            <div className="week-todo-list">
              {tasks.map(t => (
                <div
                  key={t.id}
                  className={`week-todo-item ${t.completed ? 'completed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTodo(t.id, key)
                  }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '4px',
                    color: (!t.completed && t.color) ? t.color : 'inherit'
                  }}
                >
                  {t.completed ? (
                    <CheckCircle2 size={14} color="#f87171" style={{ flexShrink: 0 }} />
                  ) : (
                    <Circle size={14} color={t.color || "rgba(255,255,255,0.2)"} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{
                    textDecoration: t.completed ? 'line-through' : 'none',
                    textDecorationColor: t.completed ? 'var(--sun-color)' : 'transparent',
                    textDecorationThickness: '2px',
                    opacity: t.completed ? 0.6 : 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {t.text}
                  </span>
                </div>
              ))}

              {/* Schedules in Weekly View */}
              {schedules.length > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />}
              {sortSchedules(schedules).map(sch => (
                <div
                  key={sch.id}
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 4px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '4px',
                    borderLeft: `2px solid ${sch.color || '#3b82f6'}`,
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#93c5fd'
                  }}
                >
                  {sch.time && sch.time.split(' ~ ')[0] && (
                    <span style={{ opacity: 0.7, marginRight: '4px', fontWeight: '700' }}>
                      {sch.time.split(' ~ ')[0]}
                    </span>
                  )}
                  {sch.text}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Main App Component ---

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // Bulk states
  const [isBulk, setIsBulk] = useState(() => {
    const saved = localStorage.getItem('todo_bulk_mode')
    return saved === 'true'
  })
  const [bulkRange, setBulkRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(endOfYear(new Date()), 'yyyy-MM-dd')
  })

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [periodTarget, setPeriodTarget] = useState(null)
  const [periodDates, setPeriodDates] = useState([])

  const [selectedColor, setSelectedColor] = useState('')
  const [colorPresets, setColorPresets] = useState(() => {
    const saved = localStorage.getItem('todo_colors')
    return saved ? JSON.parse(saved) : ['#818cf8', '#f87171', '#fbbf24', '#34d399', '#c084fc']
  })

  useEffect(() => {
    localStorage.setItem('todo_colors', JSON.stringify(colorPresets))
  }, [colorPresets])

  useEffect(() => {
    localStorage.setItem('todo_bulk_mode', isBulk)
  }, [isBulk])

  useEffect(() => {
    setBulkRange(prev => ({
      ...prev,
      start: format(currentDate, 'yyyy-MM-dd')
    }))
  }, [currentDate])

  const [todosByDate, setTodosByDate] = useState(() => {
    const saved = localStorage.getItem('todos_v2')
    return saved ? JSON.parse(saved) : {}
  })

  const [schedulesByDate, setSchedulesByDate] = useState(() => {
    const saved = localStorage.getItem('schedules_v1')
    return saved ? JSON.parse(saved) : {}
  })

  const [inputValue, setInputValue] = useState('')
  const [scheduleInputValue, setScheduleInputValue] = useState('')
  const [showScheduleTime, setShowScheduleTime] = useState(false)
  const [scheduleTimeStart, setScheduleTimeStart] = useState('')
  const [scheduleTimeEnd, setScheduleTimeEnd] = useState('')
  const [scheduleColor, setScheduleColor] = useState('')

  const schStartRef = useRef(null)
  const schEndRef = useRef(null)

  const handleSchTimeChange = (type, val) => {
    // Only allow digits and colons
    let filtered = val.replace(/[^0-9:]/g, '').slice(0, 5)

    // Auto-format logic (4-digit jump)
    let digits = val.replace(/\D/g, '')

    if (type === 'start') {
      if (digits.length === 8) {
        setScheduleTimeStart(digits.slice(0, 2) + ':' + digits.slice(2, 4))
        setScheduleTimeEnd(digits.slice(4, 6) + ':' + digits.slice(6, 8))
        setTimeout(() => schEndRef.current?.focus(), 0)
        return
      }

      let formatted = digits
      if (digits.length >= 3) {
        formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4)
      }
      setScheduleTimeStart(formatted)
      if (digits.length === 4) {
        setTimeout(() => schEndRef.current?.focus(), 0)
      }
    } else {
      let formatted = digits
      if (digits.length >= 3) {
        formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4)
      }
      setScheduleTimeEnd(formatted)
    }
  }

  useEffect(() => {
    localStorage.setItem('todos_v2', JSON.stringify(todosByDate))
  }, [todosByDate])

  useEffect(() => {
    localStorage.setItem('schedules_v1', JSON.stringify(schedulesByDate))
  }, [schedulesByDate])


  const dateKey = format(currentDate, 'yyyy-MM-dd')
  const currentTodos = todosByDate[dateKey] || []

  const handleNext = () => {
    if (viewMode === 'year') setCurrentDate(addYears(currentDate, 1))
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const handlePrev = () => {
    if (viewMode === 'year') setCurrentDate(addYears(currentDate, -1))
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, -1))
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7))
    else setCurrentDate(addDays(currentDate, -1))
  }

  const handleGoToday = () => {
    setCurrentDate(new Date())
  }

  const handleAddTodo = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const batchId = isBulk ? `batch-${Date.now()}` : null
    let datesToAdd = [dateKey]

    if (isBulk) {
      try {
        const start = parseISO(bulkRange.start)
        const end = parseISO(bulkRange.end)
        datesToAdd = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
      } catch (err) {
        alert('올바른 날짜 범위를 선택해주세요.')
        return
      }
    }

    const newTodosByDate = { ...todosByDate }
    datesToAdd.forEach(d => {
      const todo = {
        id: `${d}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: inputValue,
        completed: false,
        batchId,
        color: selectedColor,
        createdAt: new Date().toISOString()
      }
      newTodosByDate[d] = [todo, ...(newTodosByDate[d] || [])]
    })

    setTodosByDate(newTodosByDate)
    setInputValue('')
  }

  /* Schedule Logic */
  const handleAddSchedule = (e) => {
    e.preventDefault()
    if (!scheduleInputValue.trim()) return

    const now = new Date().toISOString()

    let timeStr = ''
    if (showScheduleTime) {
      if (scheduleTimeStart && scheduleTimeEnd) {
        timeStr = `${scheduleTimeStart} ~ ${scheduleTimeEnd}`
      } else if (scheduleTimeStart) {
        timeStr = `${scheduleTimeStart}`
      } else if (scheduleTimeEnd) {
        timeStr = `~ ${scheduleTimeEnd}`
      }
    }

    const schedule = {
      id: `sch-${dateKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: scheduleInputValue,
      time: timeStr,
      completed: false,
      color: scheduleColor || '#3b82f6',
      createdAt: now,
      type: 'schedule'
    }

    const newSchedulesByDate = { ...schedulesByDate }
    newSchedulesByDate[dateKey] = [schedule, ...(newSchedulesByDate[dateKey] || [])]

    setSchedulesByDate(newSchedulesByDate)
    setScheduleInputValue('')
    setScheduleTimeStart('')
    setScheduleTimeEnd('')
  }

  const handleDeleteSchedule = (id, targetDateKey = dateKey) => {
    const newSchedulesByDate = { ...schedulesByDate }
    if (newSchedulesByDate[targetDateKey]) {
      newSchedulesByDate[targetDateKey] = newSchedulesByDate[targetDateKey].filter(t => t.id !== id)
      if (newSchedulesByDate[targetDateKey].length === 0) {
        delete newSchedulesByDate[targetDateKey]
      }
      setSchedulesByDate(newSchedulesByDate)
    }
  }

  const handleToggleTodo = (id, targetDateKey = dateKey) => {
    setTodosByDate({
      ...todosByDate,
      [targetDateKey]: (todosByDate[targetDateKey] || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    })
  }

  const openDeleteModal = (todo) => {
    // 해당 할 일이 며칠 동안 등록되어 있는지 확인
    const dates = []
    Object.keys(todosByDate).forEach(d => {
      const found = todosByDate[d].some(t => {
        if (todo.batchId) return t.batchId === todo.batchId
        return t.text === todo.text
      })
      if (found) dates.push(d)
    })

    if (dates.length <= 1) {
      // 1일만 등록된 경우 바로 삭제
      const newTodosByDate = { ...todosByDate }
      newTodosByDate[dateKey] = (newTodosByDate[dateKey] || []).filter(t => t.id !== todo.id)
      setTodosByDate(newTodosByDate)
    } else {
      // 여러 날에 등록된 경우 선택 모달 표시
      const sorted = dates.sort()
      setDeleteTarget({
        ...todo,
        dateKey,
        minDate: sorted[0],
        maxDate: sorted[sorted.length - 1]
      })
    }
  }

  /* Transactional Save Handler */
  const handleSaveChanges = (target, newRanges, newColor, tempTimeStart, tempTimeEnd) => {
    const isSchedule = target.type === 'schedule' || (target.id && target.id.startsWith('sch-'))
    const sourceData = isSchedule ? schedulesByDate : todosByDate
    const setSourceData = isSchedule ? setSchedulesByDate : setTodosByDate
    const newData = { ...sourceData }

    let newTime = target.time
    if (isSchedule) {
      if (tempTimeStart && tempTimeEnd) {
        newTime = `${tempTimeStart} ~ ${tempTimeEnd}`
      } else if (tempTimeStart) {
        newTime = tempTimeStart
      } else if (tempTimeEnd) {
        newTime = `~ ${tempTimeEnd}`
      } else {
        newTime = ''
      }
    }

    const itemMatches = (arr, item) => (arr || []).find(t => {
      if (item.batchId) return t.batchId === item.batchId
      return t.text === item.text
    })
    const isItemMatch = (t, item) => {
      if (item.batchId) return t.batchId === item.batchId
      return t.text === item.text
    }

    // 1. Calculate All Old Dates for this item
    const oldDates = []
    Object.keys(sourceData).forEach(d => {
      const match = itemMatches(sourceData[d], target)
      if (match) oldDates.push(d)
    })

    // 2. Calculate All New Dates from ranges
    const newDatesSet = new Set()
    newRanges.forEach(range => {
      try {
        const start = parseISO(range.start)
        const end = parseISO(range.end)
        const interval = eachDayOfInterval({ start, end })
        interval.forEach(dt => newDatesSet.add(format(dt, 'yyyy-MM-dd')))
      } catch (e) { console.error(e) }
    })

    // 3. Diffing
    oldDates.forEach(d => {
      if (!newDatesSet.has(d)) {
        newData[d] = newData[d].filter(item => !isItemMatch(item, target))
      } else {
        newData[d] = newData[d].map(item => {
          if (isItemMatch(item, target)) {
            return { ...item, color: newColor, time: newTime }
          }
          return item
        })
      }
    })

    newDatesSet.forEach(d => {
      if (!oldDates.includes(d)) {
        const newItem = {
          id: `${isSchedule ? 'sch-' : ''}${d}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: target.text,
          completed: false,
          batchId: target.batchId,
          color: newColor,
          time: newTime,
          createdAt: new Date().toISOString(),
          type: isSchedule ? 'schedule' : undefined
        }
        newData[d] = [newItem, ...(newData[d] || [])]
      }
    })

    setSourceData(newData)
    setPeriodModalOpen(false)
  }


  // Helper for matching
  const isItemMatch = (item, target) => {
    if (target.batchId && item.batchId) return item.batchId === target.batchId
    return item.text === target.text && item.createdAt === target.createdAt
  }
  const itemMatches = (list, target) => list && list.some(i => isItemMatch(i, target))

  const openPeriodModal = (target, currentDataOverride = null) => {
    const isSchedule = target.type === 'schedule' || (target.id && target.id.startsWith('sch-'))
    const currentData = currentDataOverride || (isSchedule ? schedulesByDate : todosByDate)

    // Explicitly add type if missing for robust checking later
    const targetWithContext = { ...target, type: isSchedule ? 'schedule' : 'todo' }

    const dates = []
    Object.keys(currentData).forEach(d => {
      const found = currentData[d].some(item => {
        if (target.batchId) return item.batchId === target.batchId
        return item.text === target.text && item.createdAt === target.createdAt
      })
      if (found) dates.push(d)
    })

    // 연속된 날짜를 범위로 묶기
    const sortedDates = dates.sort().map(d => parseISO(d))
    const ranges = []
    if (sortedDates.length > 0) {
      let currentRange = { start: sortedDates[0], end: sortedDates[0] }
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = sortedDates[i - 1]
        const curr = sortedDates[i]
        // 하루 차이인지 확인
        if (isSameDay(curr, addDays(prev, 1))) {
          currentRange.end = curr
        } else {
          ranges.push({ ...currentRange })
          currentRange = { start: curr, end: curr }
        }
      }
      ranges.push(currentRange)
    }

    setPeriodTarget(targetWithContext)
    setPeriodDates(ranges.map(r => ({
      start: format(r.start, 'yyyy-MM-dd'),
      end: format(r.end, 'yyyy-MM-dd')
    })))
  }

  const executeDelete = (mode, range) => {
    if (!deleteTarget) return

    const newTodosByDate = { ...todosByDate }

    if (mode === 'single') {
      newTodosByDate[deleteTarget.dateKey] = (newTodosByDate[deleteTarget.dateKey] || []).filter(t => t.id !== deleteTarget.id)
    }
    else if (mode === 'batch') {
      Object.keys(newTodosByDate).forEach(d => {
        newTodosByDate[d] = (newTodosByDate[d] || []).filter(t => {
          if (deleteTarget.batchId) return t.batchId !== deleteTarget.batchId
          return t.text !== deleteTarget.text
        })
      })
    }
    else if (mode === 'range') {
      const start = parseISO(range.start)
      const end = parseISO(range.end)
      Object.keys(newTodosByDate).forEach(d => {
        const date = parseISO(d)
        if (isWithinInterval(date, { start, end })) {
          newTodosByDate[d] = (newTodosByDate[d] || []).filter(t => {
            if (deleteTarget.batchId) return t.batchId !== deleteTarget.batchId
            return t.text !== deleteTarget.text
          })
        }
      })
    }

    setTodosByDate(newTodosByDate)
    setDeleteTarget(null)
  }

  return (
    <div className="container">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card">
        <Header
          currentDate={currentDate}
          viewMode={viewMode}
          onPrev={handlePrev}
          onNext={handleNext}
          onShowPicker={() => setShowMonthPicker(true)}
          onGoToday={handleGoToday}
        />

        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />

        <MonthPicker
          show={showMonthPicker}
          currentDate={currentDate}
          onClose={() => setShowMonthPicker(false)}
          onChangeDate={setCurrentDate}
        />

        <DeleteConfirmModal
          show={!!deleteTarget}
          todo={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDelete={executeDelete}
        />

        <PeriodInfoModal
          show={!!periodTarget}
          todo={periodTarget}
          initialRanges={periodDates}
          onClose={() => setPeriodTarget(null)}
          onSaveChanges={handleSaveChanges}
          colorPresets={colorPresets}
          setColorPresets={setColorPresets}
        />

        <div className="main-content-area">
          {viewMode === 'year' && (
            <YearView
              currentDate={currentDate}
              onSelectMonth={(m) => { setCurrentDate(m); setViewMode('month'); }}
            />
          )}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              todosByDate={todosByDate}
              onSelectDate={(d) => { setCurrentDate(d); setViewMode('day'); }}
              schedulesByDate={schedulesByDate}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              todosByDate={todosByDate}
              onSelectDate={(d) => { setCurrentDate(d); setViewMode('day'); }}
              toggleTodo={handleToggleTodo}
              schedulesByDate={schedulesByDate}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentTodos={currentTodos}
              inputValue={inputValue}
              setInputValue={setInputValue}
              addTodo={handleAddTodo}
              toggleTodo={handleToggleTodo}
              deleteTodo={openDeleteModal}
              viewPeriod={openPeriodModal}
              isBulk={isBulk}
              setIsBulk={setIsBulk}
              bulkRange={bulkRange}
              setBulkRange={setBulkRange}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              colorPresets={colorPresets}
              setColorPresets={setColorPresets}
              todosByDate={todosByDate}
              // Schedule props
              currentSchedules={sortSchedules(schedulesByDate[dateKey] || [])}
              scheduleInputValue={scheduleInputValue}
              setScheduleInputValue={setScheduleInputValue}
              addSchedule={handleAddSchedule}
              deleteSchedule={handleDeleteSchedule}
              schedulesByDate={schedulesByDate}
              // New Schedule Props
              showScheduleTime={showScheduleTime}
              setShowScheduleTime={setShowScheduleTime}
              scheduleTimeStart={scheduleTimeStart}
              setScheduleTimeStart={setScheduleTimeStart}
              scheduleTimeEnd={scheduleTimeEnd}
              setScheduleTimeEnd={setScheduleTimeEnd}
              schStartRef={schStartRef || { current: null }}
              schEndRef={schEndRef || { current: null }}
              handleSchTimeChange={handleSchTimeChange}
              scheduleColor={scheduleColor}
              setScheduleColor={setScheduleColor}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default App
