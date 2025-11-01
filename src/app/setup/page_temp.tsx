/**
 * Time Slot Editor Component
 * 
 * Allows users to define their weekly training availability.
 * Features: Add/Remove slots, Day selector, Duration input, Priority selector
 */

'use client';

import { useState } from 'react';
import type { TimeSlot } from '@/types/user';
import { spacing, typography, colors, components } from '@/styles/designSystem';

interface SlotEditorProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

const DAYS = [
  { value: 0, label: 'So', fullLabel: 'Sonntag' },
  { value: 1, label: 'Mo', fullLabel: 'Montag' },
  { value: 2, label: 'Di', fullLabel: 'Dienstag' },
  { value: 3, label: 'Mi', fullLabel: 'Mittwoch' },
  { value: 4, label: 'Do', fullLabel: 'Donnerstag' },
  { value: 5, label: 'Fr', fullLabel: 'Freitag' },
  { value: 6, label: 'Sa', fullLabel: 'Samstag' },
];

export function SlotEditor({ slots, onChange }: SlotEditorProps) {
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);

  const addSlot = () => {
    const newSlot: TimeSlot = {
      day: 1, // Default to Monday
      startTime: '18:00',
      endTime: '19:30',
      type: 'both',
      priority: 1,
      active: true,
    };
    onChange([...slots, newSlot]);
    setExpandedSlot(slots.length); // Expand the new slot
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
    setExpandedSlot(null);
  };

  const updateSlot = (index: number, updates: Partial<TimeSlot>) => {
    const updatedSlots = slots.map((slot, i) =>
      i === index ? { ...slot, ...updates } : slot
    );
    onChange(updatedSlots);
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  const getDayLabel = (day: number) => {
    return DAYS.find(d => d.value === day)?.fullLabel || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Slot List */}
      {slots.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className={typography.body}>Noch keine Trainingszeiten definiert</p>
          <p className={`${typography.bodySmall} text-gray-500 mt-2`}>
            Füge mindestens einen Zeitslot hinzu, um deine Verfügbarkeit festzulegen
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, index) => {
            const duration = calculateDuration(slot.startTime, slot.endTime);
            const isExpanded = expandedSlot === index;

            return (
              <div
                key={index}
                className={`${components.card.base} transition-all hover:shadow-md`}
              >
                {/* Slot Header */}
                <button
                  onClick={() => setExpandedSlot(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                      <span className="font-bold text-white">
                        {DAYS.find(d => d.value === slot.day)?.label}
                      </span>
                    </div>
                    <div>
                      <p className={`${typography.body} ${typography.medium}`}>{getDayLabel(slot.day)}</p>
                      <p className={`${typography.bodySmall} text-gray-500`}>
                        {slot.startTime} - {slot.endTime} ({duration} Min)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      slot.type === 'indoor' ? 'bg-blue-100 text-blue-700' :
                      slot.type === 'outdoor' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {slot.type === 'indoor' ? 'Indoor' :
                       slot.type === 'outdoor' ? 'Outdoor' : 'Beides'}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Slot Details (Expanded) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* Day Selector */}
                    <div>
                      <label className={`${typography.label} block mb-2`}>Wochentag</label>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS.map((day) => (
                          <button
                            key={day.value}
                            onClick={() => updateSlot(index, { day: day.value })}
                            className={`py-2 rounded-lg font-medium transition-colors ${
                              slot.day === day.value
                                ? 'bg-primary-light text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`${typography.label} block mb-2`}>Start</label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                          className={components.input.base}
                        />
                      </div>
                      <div>
                        <label className={`${typography.label} block mb-2`}>Ende</label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                          className={components.input.base}
                        />
                      </div>
                    </div>

                    {/* Type Selector */}
                    <div>
                      <label className={`${typography.label} block mb-2`}>Trainingsart</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'indoor', label: 'Indoor', icon: '🏠' },
                          { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
                          { value: 'both', label: 'Beides', icon: '🔄' },
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => updateSlot(index, { type: type.value as 'indoor' | 'outdoor' | 'both' })}
                            className={`py-3 rounded-lg font-medium transition-colors ${
                              slot.type === type.value
                                ? 'bg-primary-light text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority Selector */}
                    <div>
                      <label className={`${typography.label} block mb-2`}>Priorität</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 1, label: 'Hoch', desc: 'Muss genutzt werden' },
                          { value: 2, label: 'Mittel', desc: 'Bevorzugt' },
                          { value: 3, label: 'Niedrig', desc: 'Optional' },
                        ].map((priority) => (
                          <button
                            key={priority.value}
                            onClick={() => updateSlot(index, { priority: priority.value as 1 | 2 | 3 })}
                            className={`py-3 px-2 rounded-lg font-medium transition-colors text-left ${
                              slot.priority === priority.value
                                ? 'bg-primary-light text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-semibold">{priority.label}</div>
                            <div className="text-xs opacity-80">{priority.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeSlot(index)}
                      className={components.button.secondary}
                    >
                      🗑️ Slot entfernen
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Button */}
      <button
        onClick={addSlot}
        className={`${components.button.primary} w-full`}
      >
        ➕ Trainingszeit hinzufügen
      </button>

      {/* Summary */}
      {slots.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className={`${typography.bodySmall} text-blue-900`}>
            <strong>Wöchentliche Verfügbarkeit:</strong>{' '}
            {slots.reduce((sum, slot) => sum + calculateDuration(slot.startTime, slot.endTime), 0)} Minuten
            ({Math.round(slots.reduce((sum, slot) => sum + calculateDuration(slot.startTime, slot.endTime), 0) / 60 * 10) / 10} Stunden)
            über {slots.length} Zeitslot{slots.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
