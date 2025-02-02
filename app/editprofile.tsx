import { View, Text, TextInput, FlatList, Pressable, ImageBackground } from 'react-native'
import React , {useState, useEffect} from 'react' 
import { Button, Input } from '@rneui/themed'
import AppGradient from '@/components/AppGradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/utils/supabase'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

import { MEDITATION_DATA } from '@/constants/MeditationData';
import MEDITATION_IMAGES from '@/constants/meditation-images';
import { LinearGradient } from 'expo-linear-gradient';
//MAKE GRID TO EDIT PROFILE LIKE INSTA EDIT PROFILE PAGE
export default function editProfile({ session }: { session: Session }) {
    const [loading, setLoading] = useState(true)
    const [text, setText] = useState("");
    //TODO change to empty quote when we get authentication working
    const [name, setName] = useState('')
    const [disablity, setDisability] = useState('wheelchair user')
    const [age, setAge] = useState(0)
    const [pfp, setPfp] = useState('')
        

    useEffect(() => {
        if (session) getProfile()
    }, [session])

    async function getProfile(){
        try {
            setLoading(true);
            if (!session?.user) throw new Error("No user on the session");

            const {data, error, status} = await supabase
                .from("profiles")
                .select("name, age, disability, pfpUrl")
                .eq("id", session?.user.id)
                .single()
            if (error && status !== 406){
                throw error
            }

            if (data) {
                setName(data.name)
                setAge(data.age)
                setDisability(data.disability)
                setPfp(data.pfpUrl)
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
    <View className='flex-1 bg-white'>
        <View className='mb-6 justify-center'>
          <View className='flex-column mx-auto'>  {/*View for the table*/}
            <View className='flex-row gap-2 h-12'> {/*Row*/}
              <View className='w-1/5 bg-blue-500 justify-center'>    {/*Label*/}
                <Text className='mx-2'> Name:</Text>               
              </View>
              <Input label="" value={name || ''} onChangeText={(text) => setName(text)} />
            </View>
            <View className='flex-row gap-2 h-12'> {/*Row*/}
              <View className='w-1/5 bg-blue-500 justify-center'>    {/*Label*/}
                <Text className='mx-2'> Pronouns:</Text>               
              </View>
              <TextInput
                className="asdf"
                placeholder={name}
                value={text}
                onChangeText={setText}
              />
            </View>
            <View className='flex-row gap-2 h-12'> {/*Row*/}
              <View className='w-1/5 bg-blue-500 justify-center'>    {/*Label*/}
                <Text className='mx-2'> Age:</Text>               
              </View>
              <View className='w-4/5 justify-center border-b border-gray-100'>     {/*value*/}
              <TextInput
                className="asdf"
                placeholder={String({age})}
                value={text}
                onChangeText={setText}
              />
              </View>
            </View>
            <View className='flex-row gap-2 h-12'> {/*Row*/}
              <View className='w-1/5 bg-blue-500 justify-center'>    {/*Label*/}
                <Text className='mx-2 overflow'> Disability:</Text>               
              </View>
              <View className='w-4/5 justify-center border-b border-gray-100'>     {/*value*/}
                <Text> {disablity}</Text>
              </View>
            </View>
            
          </View>
        </View>
      <StatusBar style="light"/>
    </View>
  )
}

