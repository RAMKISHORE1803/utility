import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase, modelChanges, modelDb } from "@/utils/helpers/database";
import { createClient } from "@/utils/supabase/server";
import { decodeEmail } from "@/utils/helpers/email";
import { cookies } from "next/headers";

// Interface for creating Supabase client
interface CookieMethods {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: any) => void;
    remove: (name: string, options: any) => void;
}

// Helper function to create Supabase client from token
async function createClientFromToken(token: string) {
    const cookieMethods: CookieMethods = {
        get: () => token,
        set: () => {},
        remove: () => {}
    };
    return createClient(cookieMethods);
}

// Helper function to get user details
async function getUserDetails(request: NextRequest) {
    try {
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
    } catch (error) {
        console.error('Error getting user details:', error);
        return null;
    }
}

// Main GET handler
export async function GET(request: NextRequest) {
    try {
        // Connect to database
        await connectToDatabase();

        // Get user details
        const userDetails = await getUserDetails(request);

        // Check if user is authenticated
        if (!userDetails) {
            return NextResponse.json(
                { message: 'Invalid or missing authentication' }, 
                { 
                    status: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                }
            );
        }

        // Get timetable data
        const Timetable = modelDb(userDetails);
        const data = await Timetable.find();

        // Return success response
        return NextResponse.json(
            { timetables: data },
            {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            }
        );

    } catch (error) {
        // Log error for debugging
        console.error('Error in GET /api/timetable:', error);

        // Return error response
        return NextResponse.json(
            { message: 'Internal server error' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            }
        );
    }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
    });
}