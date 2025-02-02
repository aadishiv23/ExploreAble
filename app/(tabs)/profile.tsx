import { View, Text, FlatList, Pressable, ImageBackground } from 'react-native'
import React , {useState, useEffect} from 'react' 
import AppGradient from '@/components/AppGradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/utils/supabase'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'
import { MEDITATION_DATA } from '@/constants/MeditationData';
import MEDITATION_IMAGES from '@/constants/meditation-images';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    //TODO change to empty quote when we get authentication working
    const [name, setName] = useState('Full Name')
    const [disablity, setDisability] = useState('wheelchair user')
    const [age, setAge] = useState(0)
    const [pfp, setPfp] = useState('')
        
    getProfile()
    

    async function getProfile(){
        try {
            
            console.log('Checking user session...');
            const { data, error: sessionError } = await supabase.auth.getSession();
            console.log("Data session", data)
            const {data: profile, error, status} = await supabase
                .from("profiles")
                .select("name, age, disability, pfpUrl")
                .eq("id", data?.session?.user.id)
                .single()
            if (error && status !== 406){
                console.log("error");
                throw error
            }
            console.log("Profile data:", profile);
            if (profile) {
                setName(profile.name)
                setAge(profile.age)
                setDisability(profile.disability)
                setPfp(profile.pfpUrl)
            }
        } catch (error) {
            if (error instanceof Error) {
              alert(error.message)
            }
        } finally {
            setLoading(false)
        }


    }

  return (
    <View className='flex-1'>
      <AppGradient colors={["FFFFFF", "FFFFFF"]}>
        <View className='mb-6 justify-center'>
            <Text className='text-black mb-3 font-bold text-4xl text-center'>
                {name}
            </Text>
            
            <Pressable
                className='h-32 w-32 rounded-full bg-white mx-auto mb-4'
            ></Pressable>
            <Text className='text-black text-xl font-medium text-center'>
                @user-name
            </Text>
            <Text className='text-black mb-3 font-bold text-xl text-center'>
                Age: {age}
            </Text>
            <Text className='text-black mb-3 font-bold text-xl text-center'>
                Disability: {disablity}
            </Text>
        </View>

        <View>
            <Pressable
            onPress={() => router.push("/editprofile")}
            className="h-48 my-3 rounded-md overflow-hidden"
            >
                <Text className='text-black text-3xl font-bold text-center'>Edit Profile</Text>
            </Pressable>
        </View>
      </AppGradient>

      <StatusBar style="light"/>
    </View>
  )
}

