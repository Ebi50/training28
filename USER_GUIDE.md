# User Guide - Adaptive Training System

Welcome to your intelligent cycling training companion! This guide will help you get started with personalized, data-driven training plans.

---

## 🎯 What is the Adaptive Training System?

An AI-powered training platform that:
- **Analyzes** your fitness data from Strava
- **Generates** personalized weekly training plans
- **Adapts** to your schedule and available time
- **Optimizes** your training load for peak performance

---

## 🚀 Getting Started

### Step 1: Create Your Account

1. Visit the app homepage
2. Click **"Get Started"**
3. Choose **"Sign Up"**
4. Enter your email and password
5. Click **"Sign Up"**

You'll be automatically logged in and redirected to settings.

### Step 2: Set Up Your Athlete Profile

Your profile helps the system calculate accurate training metrics.

#### Required Information:

**Date of Birth**
- Used to calculate age-based training zones
- Format: DD-MM-YYYY

**Weight (kg)**
- Current body weight
- Used for power-to-weight calculations

**FTP (Functional Threshold Power)**
- Your 1-hour maximum sustainable power in watts
- If you don't know: Use 75% of your 20-min max power
- Example: If 20-min max is 280W → FTP ≈ 210W

**LTHR (Lactate Threshold Heart Rate)**
- Heart rate at threshold intensity
- Usually 85-90% of max HR
- Example: If max HR is 180 → LTHR ≈ 160 bpm

**Max HR (Maximum Heart Rate)**
- Your maximum heart rate in bpm
- Rough estimate: 220 - your age
- Better: Measured during max effort test

Click **"Save Profile"** when done.

---

## ⏰ Setting Your Training Schedule

### Step 3: Add Training Time Slots

Tell the system when you're available to train.

#### How to Add a Time Slot:

1. Scroll to **"Training Time Slots"**
2. Click **"Add Zeitslot"** button
3. Fill in the form:
   - **Day**: Select day of week
   - **From**: Start time (e.g., 08:00)
   - **To**: End time (e.g., 09:00)
   - **Type**: Choose training location
     - **Indoor & Outdoor**: Can train anywhere
     - **Indoor**: Only indoor (trainer/gym)
     - **Outdoor**: Only outdoor rides

4. Click **"Hinzufügen"** to add the slot
5. Repeat for all your available training times
6. Click **"Save Time Slots"** at the bottom

#### Tips for Time Slots:

- **Be realistic**: Only add times you can consistently train
- **Include weekends**: Don't forget weekend availability
- **Morning slots**: Early mornings work great for consistency
- **Duration**: Minimum 45 minutes recommended per slot
- **Flexibility**: Indoor & Outdoor gives the most plan flexibility

#### Example Weekly Schedule:

```
Monday:    08:00-09:00 (Indoor & Outdoor)
           18:00-19:00 (Indoor & Outdoor)

Tuesday:   06:00-07:00 (Indoor)

Wednesday: 18:00-19:30 (Indoor & Outdoor)

Thursday:  REST

Friday:    06:00-07:00 (Indoor)

Saturday:  09:00-12:00 (Outdoor)

Sunday:    10:00-12:00 (Outdoor)
```

---

## 🔗 Connecting Strava

### Step 4: Link Your Strava Account

Strava integration enables automatic activity sync and fitness tracking.

#### Why Connect Strava?

- ✅ Automatic activity import
- ✅ Real-time fitness tracking (CTL/ATL/TSB)
- ✅ Historical training data analysis
- ✅ More accurate ML predictions
- ✅ No manual data entry needed

#### How to Connect (Simple 3-Step Process):

**Step 1: Find the Connect Button**
- Go to your **Dashboard**
- Look for the orange banner: **"Connect your Strava account"**
- Click the **"Connect Strava"** button

**Step 2: Authorize on Strava**
- You'll be redirected to **Strava.com**
- Log in to your Strava account (if not already logged in)
- Review the permissions requested:
  - ✓ Read your activities
  - ✓ Read your profile information
  - ✗ We NEVER post or modify anything!
- Click **"Authorize"** button

**Step 3: Done!**
- You'll be automatically redirected back to the app
- Status will show: **"Strava Connected ✓"**
- Your activities will start syncing immediately

#### Important Notes:

**You DO NOT need to create a Strava API account!**
- The app already has API access configured
- You only need your regular Strava account
- Just click "Connect" and authorize - that's it!

**Is It Safe?**
- Yes! This uses Strava's official OAuth system
- We only read data, never write or post
- You can revoke access anytime in [Strava Settings](https://www.strava.com/settings/apps)

**What if it doesn't work?**
- Make sure you have a Strava account
- Check that pop-ups are not blocked
- Try a different browser if issues persist

#### What Data is Synced?

- **Activities**: Ride date, duration, distance, TSS
- **Power Data**: If available (from power meter)
- **Heart Rate**: If recorded during activity
- **Route Info**: GPS data, elevation gain
- **Perceived Effort**: If you logged RPE in Strava

#### Privacy & Data Access

**What We Access:**
- Your past and future cycling activities
- Basic profile info (name, photo, athlete ID)
- Power and heart rate data from activities

**What We DON'T Access:**
- Your password (OAuth never shares passwords!)
- Private activities (unless you make them viewable)
- Your followers or social connections
- Your Strava premium subscription details

**Revoking Access:**
Can disconnect anytime in:
- App Settings → Disconnect Strava
- OR Strava.com → Settings → My Apps → Revoke Access

---

## 📊 Understanding Your Dashboard

### Dashboard Overview

**Metrics Cards:**
1. **Current Form (TSB)**: Your training readiness
   - Positive = Fresh (ready for hard training)
   - Zero = Balanced
   - Negative = Fatigued (need recovery)

2. **Fitness (CTL)**: Long-term training load
   - Higher = Better base fitness
   - Builds slowly over weeks/months

3. **This Week**: Planned training time
   - Based on your time slots
   - Updates with completed activities

### Training Status Indicators

**🟢 Fresh** (TSB > +5)
- Ready for hard intervals or races
- Good time for breakthrough workouts

**🟡 Balanced** (TSB -5 to +5)
- Normal training state
- Can handle regular training load

**🔴 Fatigued** (TSB < -5)
- Need recovery
- Plan will reduce intensity automatically

---

## 📅 Training Plans

### How Plans are Generated

The system creates weekly plans based on:
1. **Your Fitness**: Current CTL/ATL/TSB values
2. **Your Schedule**: Available time slots
3. **ML Predictions**: AI-optimized TSS targets
4. **Training Principles**: Proper periodization
5. **Recovery Needs**: Automatic deload weeks

### Plan Types

**Base Phase**
- Focus: Endurance building
- Intensity: Mostly LIT (Low Intensity Training)
- Duration: Longer, steady rides

**Build Phase**
- Focus: Raising FTP
- Intensity: Mix of LIT and HIT (High Intensity Training)
- Duration: Structured intervals

**Peak Phase**
- Focus: Race preparation
- Intensity: High-quality intervals
- Duration: Reduced volume, high intensity

### Reading Your Plan

Each workout shows:
- **Date & Time**: Scheduled slot
- **Duration**: Expected time
- **TSS**: Training Stress Score
- **Type**: LIT, HIT, Recovery
- **Description**: What to do

---

## 🎯 Advanced Features

### Training Camps

Planning a training camp? Tell the system:

1. Go to **Settings** → **Training Camps**
2. Click **"Add Camp"**
3. Enter:
   - Start date
   - End date
   - Focus (e.g., "Build endurance")
4. The system will:
   - Increase training volume during camp
   - Plan recovery week after camp
   - Adjust surrounding weeks

### Season Goals

Set major goals (races, events):

1. Go to **Settings** → **Season Goals**
2. Click **"Add Goal"**
3. Enter:
   - Goal date (race day)
   - Goal type (Race, Sportive, etc.)
   - Priority (A, B, or C)
4. The system will:
   - Build fitness toward goal date
   - Plan taper week before goal
   - Adjust training phases automatically

### Manual Adjustments

Don't like a planned workout?

1. Click the workout in your plan
2. Choose:
   - **Reschedule**: Move to different time slot
   - **Adjust Intensity**: Make easier/harder
   - **Skip**: Mark as rest day
3. System will rebalance the week

---

## 📈 Tracking Progress

### Key Metrics to Watch

**CTL (Chronic Training Load)**
- Your fitness level
- Target: Gradual increase of 3-8 TSS/week
- Too fast = Risk of injury/burnout

**ATL (Acute Training Load)**
- Recent fatigue
- Should be close to CTL
- Big spikes = High fatigue

**TSB (Training Stress Balance)**
- Form/readiness
- Negative = Tired (building fitness)
- Positive = Fresh (ready to perform)

**Ramp Rate**
- How fast fitness is changing
- Ideal: 5-10 TSS/week increase
- Over 15 TSS/week = High injury risk

### Activity History

View all synced activities:
- Click **"Recent Activities"** on dashboard
- See detailed stats for each ride
- Check if TSS matches planned workout

---

## ⚙️ Settings & Preferences

### Updating Your Profile

As your fitness improves, update:
- **FTP**: After 4-6 weeks of training
- **LTHR**: If you notice changes
- **Weight**: Regular updates for accuracy

### Changing Time Slots

Life changes? Update your schedule:
1. Go to **Settings** → **Training Time Slots**
2. Click **"Delete"** (🗑️) on old slots
3. Add new slots
4. Click **"Save Time Slots"**
5. Next week's plan will adapt

### Privacy Settings

Control your data:
- **Strava Connection**: Disconnect anytime
- **Activity Sync**: Toggle auto-sync on/off
- **Data Export**: Download your training data
- **Account Deletion**: Remove all data

---

## ❓ Strava Connection FAQ

### "Do I need to create a Strava API account?"

**NO!** This is the most common confusion. Here's how it actually works:

- **App Owner** (the person running this training system) creates ONE Strava API application
- **All users** (including you!) just use their normal Strava account
- **You only need:** A regular free Strava account at Strava.com
- **You click "Connect Strava"** → Log in → Authorize → Done!

Think of it like "Sign in with Google" - you don't create Google API, you just log in!

### "What permissions am I granting?"

When you click "Authorize", you're giving the app permission to:
- ✅ **Read** your activities (rides, runs, etc.)
- ✅ **Read** your profile info (name, photo)
- ❌ **NOT** post anything to your feed
- ❌ **NOT** modify or delete activities
- ❌ **NOT** access your password

### "Can I disconnect later?"

Yes! Two ways:
1. **In the app:** Settings → Disconnect Strava
2. **In Strava:** Settings → My Apps → Revoke Access

Your training data stays in the app, but new activities won't sync.

### "Will this post to my Strava feed?"

NO! The app only **reads** data, never posts or modifies anything.

### "Do I need Strava Premium?"

NO! A free Strava account works perfectly fine.

---

## 🆘 Troubleshooting

### Common Issues

**Q: The "Connect Strava" button doesn't work**
- Check if pop-ups are blocked in your browser
- Try a different browser (Chrome, Firefox, Safari)
- Make sure you're logged into the app first

**Q: I get redirected but nothing happens**
- Check if you're at the correct callback URL
- Try disconnecting and connecting again
- Contact admin if issue persists

**Q: My activities aren't syncing from Strava**
- Check Dashboard for "Strava Connected ✓" status
- Upload a new test activity to Strava
- Try disconnecting and reconnecting
- Wait 5-10 minutes for webhook to trigger

**Q: Training plan shows no workouts**
- Add training time slots in Settings
- Make sure FTP and weight are set
- Check that current week hasn't passed

**Q: TSS values seem wrong**
- Update your FTP if it has changed
- Check activity power data in Strava
- Contact admin if persistently incorrect

**Q: Can't log in**
- Check email/password spelling
- Try password reset
- Clear browser cache and cookies

**Q: Plan too hard/easy**
- System adapts over 2-3 weeks
- Manually adjust individual workouts
- Update FTP if significantly changed

---

## 💡 Pro Tips

1. **Consistency Beats Intensity**
   - Better to do 5 easy rides than 1 hard ride
   - System rewards consistent training

2. **Trust the Recovery**
   - Rest days are when you get stronger
   - Don't skip recovery weeks

3. **Update Your FTP Regularly**
   - Every 4-6 weeks
   - After significant fitness changes

4. **Use All Your Time Slots**
   - More availability = Better plans
   - Even short 45-min sessions help

5. **Log All Activities in Strava**
   - Cross-training, running, gym work
   - Helps system track total stress

6. **Plan Ahead**
   - Add races/events 8-12 weeks in advance
   - System needs time to build fitness

7. **Listen to Your Body**
   - Sick? Skip workouts and let system adjust
   - Feeling great? System will increase load

---

## 📱 Mobile Usage

Currently web-only, but mobile-friendly:
- Works in any mobile browser
- Bookmark for quick access
- Add to home screen for app-like experience

**iOS:**
1. Open in Safari
2. Tap share icon
3. "Add to Home Screen"

**Android:**
1. Open in Chrome
2. Menu → "Add to Home Screen"

---

## 🔒 Privacy & Data

### What We Store
- Your profile data (age, FTP, etc.)
- Training time slots
- Strava activities (if connected)
- Generated training plans

### What We DON'T Store
- Payment information (free to use)
- Private Strava data beyond activities
- Location data from GPS tracks

### Your Rights
- Export all data anytime
- Delete account and all data
- Disconnect Strava whenever you want

---

## 🎓 Training Resources

### Learn More About:

**TSS (Training Stress Score)**
- Quantifies training intensity
- 100 TSS = 1 hour at threshold
- Higher TSS = Harder workout

**Power-Based Training**
- Most accurate training method
- Requires power meter
- Enables precise TSS calculation

**Heart Rate Training**
- Alternative to power
- Less accurate but useful
- System uses LTHR for calculations

**Periodization**
- Structured training phases
- Build → Peak → Recover
- System handles this automatically

---

## 📞 Getting Help

**Email Support**: support@adaptivetraining.app
**FAQ**: Check common questions above
**Bug Reports**: GitHub Issues
**Feature Requests**: Email or GitHub

---

## 🎉 Best Practices for Success

1. ✅ Set realistic time slots
2. ✅ Connect Strava for best results
3. ✅ Update FTP every 4-6 weeks
4. ✅ Log ALL activities in Strava
5. ✅ Trust the recovery days
6. ✅ Plan season goals in advance
7. ✅ Adjust plans as life changes
8. ✅ Be consistent, not perfect

---

## 📊 Expected Results

**After 4 Weeks:**
- Better understanding of your capacity
- More consistent training rhythm
- Improved recovery timing

**After 8 Weeks:**
- Measurable fitness gains (CTL increase)
- More accurate ML predictions
- Better training adaptation

**After 12 Weeks:**
- Significant FTP improvements
- Optimized training load
- Peak performance for goals

---

## 🏆 Success Stories

*"Increased my FTP by 15 watts in 8 weeks while working full-time!"*
*"The automatic recovery weeks saved me from burnout."*
*"Best training tool I've used - it actually adapts to my life!"*

---

## 📝 Quick Reference Card

### Key Metrics
- **TSS**: Training load (100 = 1hr @ threshold)
- **CTL**: Fitness (higher = better)
- **ATL**: Fatigue (recent training load)
- **TSB**: Form (readiness to perform)

### Training Zones
- **LIT**: Easy, conversational pace
- **Threshold**: FTP pace, hard but sustainable
- **VO2max**: Very hard, 3-5 min efforts
- **Anaerobic**: Max effort, < 2 min

### Plan Adjustments
- **Need Rest?**: Skip workout, system adapts
- **Feeling Strong?**: Do extra 15 min easy
- **Short on Time?**: Shorten but keep intensity

---

Happy Training! 🚴‍♂️💪
