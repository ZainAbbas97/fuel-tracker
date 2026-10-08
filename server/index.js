import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, migrate } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const here = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());

const fail = (res, error) => { console.error(error); res.status(500).json({error: 'Database request failed'}); };

app.get('/api/cars', async (_req,res) => { try { const {rows}=await pool.query('select id,name,type,average_km_per_litre as efficiency,tint,icon from cars order by created_at'); res.json(rows); } catch(e){fail(res,e);} });
app.patch('/api/cars/:id', async (req,res) => { try { const {name,efficiency,type}=req.body; const {rows}=await pool.query('update cars set name=coalesce($1,name), average_km_per_litre=coalesce($2,average_km_per_litre), type=coalesce($3,type) where id=$4 returning id,name,type,average_km_per_litre as efficiency,tint,icon',[name,efficiency,type,req.params.id]); res.json(rows[0]); } catch(e){fail(res,e);} });
app.get('/api/settings', async (_req,res) => { try { const {rows}=await pool.query('select petrol_rate as rate,currency from settings where id=1'); res.json(rows[0]); } catch(e){fail(res,e);} });
app.patch('/api/settings', async (req,res) => { try { const {rows}=await pool.query('update settings set petrol_rate=coalesce($1,petrol_rate) where id=1 returning petrol_rate as rate,currency',[req.body.rate]); res.json(rows[0]); } catch(e){fail(res,e);} });
app.get('/api/entries', async (_req,res) => { try { const {rows}=await pool.query(`select e.id,e.driven_on as date,e.driven_km as km,e.car_id as car from daily_entries e order by e.driven_on desc,e.created_at desc`); res.json(rows); } catch(e){fail(res,e);} });
app.post('/api/entries', async (req,res) => { try { const {rows}=await pool.query('insert into daily_entries (car_id,driven_km,driven_on) values ($1,$2,$3) returning id,driven_on as date,driven_km as km,car_id as car',[req.body.car,req.body.km,req.body.date]); res.status(201).json(rows[0]); } catch(e){fail(res,e);} });
app.delete('/api/entries/:id', async (req,res) => { try { await pool.query('delete from daily_entries where id=$1',[req.params.id]); res.status(204).end(); } catch(e){fail(res,e);} });

if (process.env.NODE_ENV === 'production') { app.use(express.static(path.join(here, '..', 'dist'))); app.get(/.*/, (_req,res)=>res.sendFile(path.join(here,'..','dist','index.html'))); }

migrate().then(()=>app.listen(port,()=>console.log(`Fuel Tracker API listening on ${port}`))).catch(error=>{ console.error('Migration failed',error); process.exit(1); });
