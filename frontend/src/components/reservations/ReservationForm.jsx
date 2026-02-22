import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const ReservationForm = ({ 
    selectedRoom, 
    date, 
    session, 
    selectedTime, 
    isManualEntry = false, 
    onSuccess, 
    onCancel 
}) => {
    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', pax: 2, message: ''
    });
    
    const [manualDate, setManualDate] = useState(date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const [manualSession, setManualSession] = useState(session || 'LUNCH');
    const [manualTime, setManualTime] = useState(selectedTime || '');
    const [rooms, setRooms] = useState([]); 
    const [manualRoomId, setManualRoomId] = useState(''); 
    const [manualSource, setManualSource] = useState('PHONE'); // <-- NEW: Default to Phone for manual entry
    const [submitStatus, setSubmitStatus] = useState(null);

    const generateTimeSlots = (sessionType) => {
        const slots = [];
        const startHour = sessionType === 'LUNCH' ? 11 : 17; 
        const endHour = sessionType === 'LUNCH' ? 14 : 22;     

        for (let hour = startHour; hour <= endHour; hour++) {
            const displayHour = hour > 12 ? hour - 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            slots.push({ value: `${hour}:00:00`, label: `${displayHour}:00 ${ampm}` });
            if (hour !== endHour) {
                slots.push({ value: `${hour}:30:00`, label: `${displayHour}:30 ${ampm}` });
            }
        }
        return slots;
    };

    useEffect(() => {
        if (isManualEntry) {
            const fetchRooms = async () => {
                try {
                    const res = await fetch(`${BACKEND_URL}/api/reservations/check/?date=${manualDate}&session=${manualSession}`);
                    const data = await res.json();
                    setRooms(data);
                } catch (err) {
                    console.error("Failed to load rooms", err);
                }
            };
            fetchRooms();
            setManualTime(''); 
            setManualRoomId('');
        }
    }, [isManualEntry, manualDate, manualSession]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.contact || !formData.pax) {
            toast.error("Please fill in Name, Contact, and Guests.");
            return;
        }

        const finalRoomId = isManualEntry ? manualRoomId : selectedRoom;
        if (!finalRoomId) {
            toast.error("Please select a Room or Dining Area.");
            return;
        }

        const finalTime = isManualEntry ? manualTime : selectedTime;
        if (!finalTime) {
            toast.error("Please select an arrival time.");
            return;
        }

        setSubmitStatus('loading');

        const payload = {
            customer_name: formData.name,
            customer_contact: formData.contact,
            customer_email: formData.email,
            date: isManualEntry ? manualDate : format(date, 'yyyy-MM-dd'),
            session: isManualEntry ? manualSession : session,
            time: finalTime,
            pax: formData.pax,
            dining_area: finalRoomId,
            special_request: formData.message,
            status: isManualEntry ? 'CONFIRMED' : 'PENDING',
            source: isManualEntry ? manualSource : 'WEB' // <-- NEW: Passes source to backend
        };

        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        
        if (isManualEntry && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/reservations/create/`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSubmitStatus('success');
                if (onSuccess) onSuccess();
            } else {
                const errData = await res.json();
                const errorMessage = errData.non_field_errors 
                    ? errData.non_field_errors[0] 
                    : "Booking failed. Please check details.";
                toast.error(errorMessage);
                setSubmitStatus('error');
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
            setSubmitStatus('error');
        }
    };

    const inputClass = "w-full bg-white border border-gray-300 p-2.5 text-gray-900 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none rounded-sm transition-all shadow-sm";
    const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1";

    return (
        <form onSubmit={handleSubmit} className="text-left">
            
            {/* --- ADMIN ONLY: LOGISTICS --- */}
            {isManualEntry && (
                <div className="bg-gray-50 p-5 rounded-md border border-gray-200 mb-6">
                    <h3 className="text-gold-600 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">
                        Logistics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelClass}>Date</label>
                            <input 
                                type="date" required
                                className={inputClass}
                                value={manualDate}
                                onChange={e => setManualDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Session</label>
                            <div className="flex rounded-sm overflow-hidden border border-gray-300">
                                <button
                                    type="button"
                                    onClick={() => setManualSession('LUNCH')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase ${manualSession === 'LUNCH' ? 'bg-gold-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Lunch
                                </button>
                                <div className="w-[1px] bg-gray-300"></div>
                                <button
                                    type="button"
                                    onClick={() => setManualSession('DINNER')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase ${manualSession === 'DINNER' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Dinner
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelClass}>Arrival Time</label>
                            <select 
                                required
                                className={inputClass}
                                value={manualTime}
                                onChange={e => setManualTime(e.target.value)}
                            >
                                <option value="" disabled>-- Select Time --</option>
                                {generateTimeSlots(manualSession).map((slot, index) => (
                                    <option key={index} value={slot.value}>{slot.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Assign Table / Room</label>
                            <select 
                                required
                                className={inputClass}
                                value={manualRoomId}
                                onChange={e => setManualRoomId(e.target.value)}
                            >
                                <option value="" disabled>-- Select Area --</option>
                                {rooms.map(room => {
                                    let label = `${room.name}`;
                                    let isDisabled = !room.is_available;

                                    if (room.area_type === 'HALL') {
                                        label += ` (Hall: ${room.remaining_capacity} seats)`;
                                    } else if (!room.is_available) {
                                        label += " [BOOKED]";
                                    } else {
                                        label += " (VIP)";
                                    }

                                    return (
                                        <option key={room.id} value={room.id} disabled={isDisabled} className={isDisabled ? 'text-gray-300' : 'text-gray-900'}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {/* NEW: Booking Source Selection */}
                    <div>
                        <label className={labelClass}>Booking Source</label>
                        <select 
                            className={inputClass}
                            value={manualSource}
                            onChange={e => setManualSource(e.target.value)}
                        >
                            <option value="PHONE">Phone Call / Mobile</option>
                            <option value="SOCIAL">Social Media (Viber/WeChat/FB)</option>
                            <option value="WALK_IN">Walk-in</option>
                        </select>
                    </div>

                </div>
            )}

            {/* --- CUSTOMER DETAILS --- */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Customer Name</label>
                        <input required type="text" className={inputClass} 
                            placeholder="e.g. John Doe"
                            onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}>Contact No.</label>
                        <input required type="text" className={inputClass} 
                            placeholder="e.g. 0917..."
                            onChange={e => setFormData({...formData, contact: e.target.value})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Email (Optional)</label>
                        <input type="email" className={inputClass} 
                            placeholder="name@example.com"
                            onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}>Pax</label>
                        <input required type="number" min="1" className={inputClass} 
                            onChange={e => setFormData({...formData, pax: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Special Request / Notes</label>
                    <textarea className={`${inputClass} h-20 resize-none`} 
                        placeholder="Allergies, special occasion, high chair..."
                        onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                </div>
            </div>

            {/* --- ACTIONS --- */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="flex-1 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs font-bold rounded-sm border border-transparent">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={submitStatus === 'loading'} 
                    className="flex-1 bg-gold-600 text-white font-bold uppercase tracking-widest py-3 text-xs hover:bg-gold-700 transition-colors disabled:opacity-50 rounded-sm shadow-md">
                    {submitStatus === 'loading' ? 'Saving...' : (isManualEntry ? 'Create Booking' : 'Request Reservation')}
                </button>
            </div>
        </form>
    );
};

export default ReservationForm;