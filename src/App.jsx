import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Trash2, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Grid, List, Columns, LogIn, LogOut, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, startOfYear, endOfYear,
  eachMonthOfInterval, addYears, setMonth, setYear
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

// --- Sub-Components (Moved outside to prevent focus loss) ---

const Header = ({ currentDate, viewMode, onPrev, onNext, onShowPicker }) => {
  const fullDateStr = format(currentDate, 'yyyy년 MMMM d일 (EEEE)', { locale: ko })
  const monthStr = format(currentDate, 'yyyy년 MMMM', { locale: ko })
  const yearStr = format(currentDate, 'yyyy년')

  let displayStr = monthStr
  if (viewMode === 'day' || viewMode === 'week') displayStr = fullDateStr
  if (viewMode === 'year') displayStr = yearStr

  const colorClass = viewMode === 'day' ? getDayColorClass(currentDate) : ''

  return (
    <div className="calendar-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <CalendarIcon size={32} color="#818cf8" />
        <h1 style={{ margin: 0, fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.8rem' }}>
          Diary Pro
        </h1>
      </div>

      <div className="date-selector">
        <button className="nav-btn" onClick={onPrev} title="이전"><ChevronLeft size={24} /></button>
        <div className="date-info-container" onClick={onShowPicker}>
          <span className={`current-date-text ${colorClass}`}>{displayStr}</span>
          <span className="date-subtext">클릭하여 날짜 이동</span>
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

const MonthView = ({ currentDate, todosByDate, onSelectDate }) => {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="month-grid">
      {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
        <div key={d} className={i === 0 ? 'day-sun' : i === 6 ? 'day-sat' : ''} style={{ padding: '0.5rem', fontSize: '0.8rem', opacity: 0.5, fontWeight: '700' }}>{d}</div>
      ))}
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        const hasTodos = todosByDate[key]?.length > 0
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
            {hasTodos && <div className="dot-indicator" />}
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

const DayView = ({ currentTodos, inputValue, setInputValue, addTodo, toggleTodo, deleteTodo }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem' }}>
      <input
        type="text"
        placeholder="오늘의 할 일을 입력하세요..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit" className="add-btn">추가</button>
    </form>
    <div className="todo-list">
      <AnimatePresence mode="popLayout">
        {currentTodos.map(todo => (
          <motion.div key={todo.id} layout className="todo-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.completed ? <CheckCircle2 size={20} color="#10b981" /> : <Circle size={20} color="rgba(255,255,255,0.3)" />}
              <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>{todo.text}</span>
            </div>
            <button className="delete-btn" onClick={() => deleteTodo(todo.id)}><Trash2 size={18} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
      {currentTodos.length === 0 && <p style={{ opacity: 0.4, marginTop: '3rem' }}>오늘의 할 일이 아직 없습니다.</p>}
    </div>
  </div>
)

const WeekView = ({ currentDate, todosByDate, onSelectDate }) => {
  const start = startOfWeek(currentDate)
  const days = eachDayOfInterval({ start, end: addDays(start, 6) })
  return (
    <div className="week-grid">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        const tasks = todosByDate[key] || []
        const colorClass = getDayColorClass(day)
        return (
          <div key={key} className="week-day-column" onClick={() => onSelectDate(day)}>
            <div className={`week-day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
              <span className={`week-day-name ${colorClass}`}>{format(day, 'EEEE', { locale: ko })}</span>
              <span className={`week-day-num ${colorClass}`}>{format(day, 'd')}일</span>
              {HOLIDAYS_2026[key] && <span className="day-holiday" style={{ fontSize: '0.65rem', fontWeight: '700' }}>{HOLIDAYS_2026[key]}</span>}
            </div>
            <div className="week-todo-list">
              {tasks.map(t => (
                <div key={t.id} className={`week-todo-item ${t.completed ? 'completed' : ''}`}>
                  {t.text}
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

  const [todosByDate, setTodosByDate] = useState(() => {
    const saved = localStorage.getItem('todos_v2')
    return saved ? JSON.parse(saved) : {}
  })
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    localStorage.setItem('todos_v2', JSON.stringify(todosByDate))
  }, [todosByDate])

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

  const handleAddTodo = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    const newTodo = { id: Date.now(), text: inputValue, completed: false }
    setTodosByDate({ ...todosByDate, [dateKey]: [newTodo, ...currentTodos] })
    setInputValue('')
  }

  const handleToggleTodo = (id) => {
    setTodosByDate({
      ...todosByDate,
      [dateKey]: currentTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    })
  }

  const handleDeleteTodo = (id) => {
    setTodosByDate({
      ...todosByDate,
      [dateKey]: currentTodos.filter(t => t.id !== id)
    })
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
        />

        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />

        <MonthPicker
          show={showMonthPicker}
          currentDate={currentDate}
          onClose={() => setShowMonthPicker(false)}
          onChangeDate={setCurrentDate}
        />

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
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
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              todosByDate={todosByDate}
              onSelectDate={(d) => { setCurrentDate(d); setViewMode('day'); }}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentTodos={currentTodos}
              inputValue={inputValue}
              setInputValue={setInputValue}
              addTodo={handleAddTodo}
              toggleTodo={handleToggleTodo}
              deleteTodo={handleDeleteTodo}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default App
