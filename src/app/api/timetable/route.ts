import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase, modelChanges, modelDb } from "@/utils/helpers/database";
import { createClient } from "@/utils/supabase/server";
import { decodeEmail } from "@/utils/helpers/email";
import { cookies } from "next/headers";

// Helper function to create Supabase client from token
async function createClientFromToken(token: string) {
    return createClient({
        get: () => token,
        set: () => {},
        remove: () => {},
    });
}

async function getUserDetails(request: NextRequest) {
    // Check for Authorization header first (mobile clients)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const supabase = await createClientFromToken(token);
        return await decodeEmail(supabase);
    }
    
    // Fallback to cookies (web clients)
    const cookiestore = await cookies();
    const supabase = await createClient(cookiestore);
    return await decodeEmail(supabase);
}

async function handleRequest(request: NextRequest) {
    try {
        await connectToDatabase();

        const userDetails = await getUserDetails(request);

        if (!userDetails) {
            return NextResponse.json(
                { message: 'Invalid or missing authentication' }, 
                { status: 401 }
            );
        }

        const Timetable = modelDb(userDetails);
        const data = await Timetable.find();

        return NextResponse.json({ timetables: data });

    } catch (error) {
        console.error('Error fetching timetable:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle GET requests
export async function GET(request: NextRequest) {
    return handleRequest(request);
}

// Handle POST requests
export async function POST(request: NextRequest) {
    return handleRequest(request);
}

// Update your OPTIONS handler with the correct origin
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin');
    const allowedOrigins = ['https://utility-app-csvsd3.flutterflow.app/'];
    
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '*',
            'Access-Control-Allow-Credentials': 'true'
        },
    });
}