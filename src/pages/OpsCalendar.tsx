import { useState, useMemo } from 'react';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  AlertTriangle,
  Rocket,
  Clock,
  Plus,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { cn, formatNumber } from '../lib/utils';

type EventType = 'po_arrival' | 'launch' | 'stockout' | 'transfer' | 'reorder_deadline';

interface CalendarEvent {
  id: string;
  date: Date;
  type: EventType;
  title: string;
  description?: string;
  sku?: string;
  quantity?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

// Mock events
const MOCK_EVENTS: CalendarEvent[] = [
  // February 2026
  { id: 'e1', date: new Date('2026-02-11'), type: 'po_arrival', title: 'Cherry Plushie PO Arrives', sku: 'OG-M-009', quantity: 500, priority: 'medium', description: 'From Mars Warehouse' },
  { id: 'e2', date: new Date('2026-02-12'), type: 'stockout', title: 'Violet Capybara Stockout Risk', sku: 'OG-M-005', priority: 'critical', description: 'Only 6 days of stock remaining' },
  { id: 'e3', date: new Date('2026-02-14'), type: 'launch', title: "Valentine's Collection Ends", priority: 'high', description: 'Last day for Valentine promotions' },
  { id: 'e4', date: new Date('2026-02-16'), type: 'transfer', title: 'FBA Replenishment', sku: 'OG-M-007', quantity: 200, priority: 'medium', description: 'Matcha transfer to FBA US' },
  { id: 'e5', date: new Date('2026-02-18'), type: 'reorder_deadline', title: 'Reorder Deadline: Lily', sku: 'OG-M-006', priority: 'high', description: 'Order today to avoid stockout' },
  { id: 'e6', date: new Date('2026-02-20'), type: 'po_arrival', title: 'Violet PO Arrives', sku: 'OG-M-005', quantity: 200, priority: 'high' },
  { id: 'e7', date: new Date('2026-02-25'), type: 'launch', title: 'Spring Collection Launch 🌸', priority: 'critical', description: 'Major product drop - ensure all inventory ready' },
  { id: 'e8', date: new Date('2026-02-27'), type: 'po_arrival', title: 'Strawberry Restock', sku: 'OG-M-002', quantity: 300, priority: 'low' },
  
  // March 2026
  { id: 'e9', date: new Date('2026-03-05'), type: 'stockout', title: 'Coffee Charm Low Stock', sku: 'OG-KEY-012', priority: 'high' },
  { id: 'e10', date: new Date('2026-03-10'), type: 'transfer', title: 'TikTok Shop Restock', quantity: 100, priority: 'medium' },
  { id: 'e11', date: new Date('2026-03-18'), type: 'launch', title: 'Dessert Collection Launch 🧁', priority: 'critical' },
  { id: 'e12', date: new Date('2026-03-22'), type: 'reorder_deadline', title: 'Q2 Planning Deadline', priority: 'high' },
];

const eventTypeConfig: Record<EventType, { icon: typeof Calendar; color: string; bg: string; label: string }> = {
  po_arrival: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', label: 'PO Arrival' },
  launch: { icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Launch' },
  stockout: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Stockout Risk' },
  transfer: { icon: Truck, color: 'text-green-600', bg: 'bg-green-100', label: 'Transfer' },
  reorder_deadline: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Reorder' },
};

const priorityColors = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

export function OpsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date('2026-02-11'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterTypes, setFilterTypes] = useState<Set<EventType>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [, setShowEventModal] = useState(false);
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const days: Date[] = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i);
      days.push(date);
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }
    
    // Next month padding
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i));
    }
    
    return days;
  }, [currentYear, currentMonth]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    let events = MOCK_EVENTS;
    if (filterTypes.size > 0) {
      events = events.filter(e => filterTypes.has(e.type));
    }
    return events;
  }, [filterTypes]);
  
  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => 
      e.date.toDateString() === selectedDate.toDateString()
    );
  }, [selectedDate, filteredEvents]);
  
  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(e => e.date.toDateString() === date.toDateString());
  };
  
  // Stats for the month
  const monthStats = useMemo(() => {
    const monthEvents = filteredEvents.filter(e => 
      e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear
    );
    return {
      total: monthEvents.length,
      launches: monthEvents.filter(e => e.type === 'launch').length,
      poArrivals: monthEvents.filter(e => e.type === 'po_arrival').length,
      stockoutRisks: monthEvents.filter(e => e.type === 'stockout').length,
      critical: monthEvents.filter(e => e.priority === 'critical').length,
    };
  }, [filteredEvents, currentMonth, currentYear]);
  
  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
  };
  
  const toggleFilter = (type: EventType) => {
    setFilterTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };
  
  const isToday = (date: Date) => {
    const today = new Date('2026-02-11'); // Mock today
    return date.toDateString() === today.toDateString();
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };
  
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Ops Calendar" 
        subtitle="Plan launches, POs, and inventory events"
        onRefresh={() => setIsLoading(true)}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-700">{monthStats.launches}</p>
                  <p className="text-sm text-purple-600">Launches</p>
                </div>
                <Rocket className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-700">{monthStats.poArrivals}</p>
                  <p className="text-sm text-blue-600">PO Arrivals</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "bg-gradient-to-br border-2",
            monthStats.stockoutRisks > 0 
              ? "from-red-50 to-red-100 border-red-300" 
              : "from-green-50 to-green-100 border-green-200"
          )}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(
                    "text-2xl font-bold",
                    monthStats.stockoutRisks > 0 ? "text-red-700" : "text-green-700"
                  )}>
                    {monthStats.stockoutRisks}
                  </p>
                  <p className={cn(
                    "text-sm",
                    monthStats.stockoutRisks > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    Stockout Risks
                  </p>
                </div>
                <AlertTriangle className={cn(
                  "w-8 h-8",
                  monthStats.stockoutRisks > 0 ? "text-red-400" : "text-green-400"
                )} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-700">{monthStats.total}</p>
                  <p className="text-sm text-green-600">Total Events</p>
                </div>
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "bg-gradient-to-br border-2",
            monthStats.critical > 0 
              ? "from-orange-50 to-orange-100 border-orange-300 animate-pulse" 
              : "from-gray-50 to-gray-100 border-gray-200"
          )}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(
                    "text-2xl font-bold",
                    monthStats.critical > 0 ? "text-orange-700" : "text-gray-700"
                  )}>
                    {monthStats.critical}
                  </p>
                  <p className={cn(
                    "text-sm",
                    monthStats.critical > 0 ? "text-orange-600" : "text-gray-600"
                  )}>
                    Critical
                  </p>
                </div>
                <Clock className={cn(
                  "w-8 h-8",
                  monthStats.critical > 0 ? "text-orange-400" : "text-gray-400"
                )} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="min-w-[180px] text-center">{monthName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEventModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  Filter:
                </span>
                {Object.entries(eventTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  const isActive = filterTypes.size === 0 || filterTypes.has(type as EventType);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleFilter(type as EventType)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                        isActive ? `${config.bg} ${config.color}` : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((date, idx) => {
                  const dayEvents = getEventsForDay(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const hasCritical = dayEvents.some(e => e.priority === 'critical');
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "min-h-[80px] p-1 border rounded-lg text-left transition-all hover:bg-gray-50",
                        !isCurrentMonth(date) && "opacity-40",
                        isToday(date) && "border-amber-500 border-2",
                        isSelected && "ring-2 ring-amber-500 bg-amber-50",
                        hasCritical && !isSelected && "border-red-300 bg-red-50"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday(date) ? "text-amber-600" : "text-gray-700"
                      )}>
                        {date.getDate()}
                        {isToday(date) && (
                          <span className="ml-1 text-xs text-amber-500">Today</span>
                        )}
                      </div>
                      
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(event => {
                          const config = eventTypeConfig[event.type];
                          return (
                            <div 
                              key={event.id}
                              className={cn(
                                "text-xs truncate px-1 py-0.5 rounded",
                                config.bg,
                                config.color
                              )}
                            >
                              {event.title.slice(0, 15)}...
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event Details Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                {selectedDate 
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                  : 'Select a Date'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a date to view events</p>
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-4">No events on this date</p>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config.icon;
                    
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "p-3 rounded-lg border-l-4",
                          priorityColors[event.priority],
                          "bg-gray-50 hover:bg-gray-100 transition-colors"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", config.bg)}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant={
                                event.priority === 'critical' ? 'danger' :
                                event.priority === 'high' ? 'warning' : 'default'
                              }>
                                {event.priority}
                              </Badge>
                              {event.sku && (
                                <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                                  {event.sku}
                                </span>
                              )}
                              {event.quantity && (
                                <span className="text-xs text-gray-600">
                                  {formatNumber(event.quantity)} units
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Timeline */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upcoming Events (Next 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-4">
                {filteredEvents
                  .filter(e => {
                    const today = new Date('2026-02-11');
                    const twoWeeks = new Date(today);
                    twoWeeks.setDate(twoWeeks.getDate() + 14);
                    return e.date >= today && e.date <= twoWeeks;
                  })
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map(event => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config.icon;
                    const today = new Date('2026-02-11');
                    const daysAway = Math.ceil((event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={event.id} className="relative flex items-start gap-4 pl-12">
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute left-4 w-5 h-5 rounded-full border-2 border-white",
                          config.bg,
                          event.priority === 'critical' && "ring-2 ring-red-400"
                        )}>
                          <Icon className={cn("w-3 h-3 absolute top-0.5 left-0.5", config.color)} />
                        </div>
                        
                        <div className={cn(
                          "flex-1 p-3 rounded-lg border-l-4 bg-white hover:shadow-sm transition-shadow",
                          priorityColors[event.priority]
                        )}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-500">
                                {event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                <span className="mx-2">•</span>
                                {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway} days away`}
                              </p>
                            </div>
                            <Badge variant={
                              event.priority === 'critical' ? 'danger' :
                              event.priority === 'high' ? 'warning' : 'default'
                            }>
                              {event.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
